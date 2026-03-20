import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";

const VALID_RANGES = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y"];
const VALID_INTERVALS = ["1d", "1wk", "1mo"];

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const range = searchParams.get("range") || "3mo";
  const interval = searchParams.get("interval") || "1d";

  if (!symbol) {
    return NextResponse.json(
      { error: "Parâmetro symbol é obrigatório" },
      { status: 400 }
    );
  }

  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json(
      { error: `Range inválido. Valores aceitos: ${VALID_RANGES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!VALID_INTERVALS.includes(interval)) {
    return NextResponse.json(
      { error: `Interval inválido. Valores aceitos: ${VALID_INTERVALS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://brapi.dev/api/quote/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&fundamental=false`
    );

    if (!response.ok) {
      console.error("Erro da API Brapi (candles):", response.status);
      return NextResponse.json(
        { status: "no_data", candles: [] },
        {
          status: 200,
          headers: { "Cache-Control": "private, max-age=60" },
        }
      );
    }

    const data = await response.json();
    const results = data.results;

    if (!results || results.length === 0 || !results[0].historicalDataPrice) {
      return NextResponse.json(
        { status: "no_data", candles: [] },
        {
          status: 200,
          headers: { "Cache-Control": "private, max-age=300" },
        }
      );
    }

    const historicalData = results[0].historicalDataPrice;

    const candles = historicalData.map((item: { date: number; open: number; high: number; low: number; close: number; volume: number }) => ({
      timestamp: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }));

    return NextResponse.json(
      { status: "ok", candles },
      {
        status: 200,
        headers: { "Cache-Control": "private, max-age=300" },
      }
    );
  } catch (error) {
    console.error("Erro interno ao buscar candles da Brapi:", error);
    return NextResponse.json(
      { status: "no_data", candles: [] },
      { status: 200 }
    );
  }
}
