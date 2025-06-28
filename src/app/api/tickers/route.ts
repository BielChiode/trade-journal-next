import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "O parâmetro do símbolo é obrigatório" },
      { status: 400 }
    );
  }

  const apiKey = process.env.FINNHUB_DATA_API_KEY;
  if (!apiKey || apiKey === "SUA_CHAVE_API_AQUI") {
    console.error("A chave da API da Finnhub não está configurada");
    return NextResponse.json(
      { error: "A chave da API não está configurada no servidor" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${symbol}&token=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro da API da Finnhub:", errorData);
      return NextResponse.json(
        { error: "Erro ao buscar dados da Finnhub" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.result) {
      return NextResponse.json([]);
    }

    const processedData = data.result
      .map((item: any) => {
        const isBrazilian = item.symbol.endsWith(".SA");
        const symbol = isBrazilian
          ? item.symbol.replace(".SA", "")
          : item.symbol;

        // Filtra tickers que ainda contêm "." (de outros mercados) ou que são inválidos
        if (symbol.includes(".") || !symbol) return null;

        return {
          symbol: symbol,
          instrument_name: item.description,
          exchange: "", // A API de busca da Finnhub não fornece a bolsa
          isBrazilian: isBrazilian,
        };
      })
      .filter(Boolean); // Remove os itens nulos

    // Ordena para priorizar os tickers brasileiros
    processedData.sort((a: any, b: any) => {
      if (a.isBrazilian && !b.isBrazilian) return -1;
      if (!a.isBrazilian && b.isBrazilian) return 1;
      return a.symbol.localeCompare(b.symbol);
    });

    // Remove a propriedade `isBrazilian` antes de enviar para o cliente
    const formattedData = processedData.map(
      ({ isBrazilian, ...rest }: any) => rest
    );

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error(
      "Erro interno do servidor ao buscar na API da Finnhub:",
      error
    );
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
