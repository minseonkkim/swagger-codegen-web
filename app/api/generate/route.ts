export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    const res = await fetch(url);
    const swaggerJson = await res.json();

    return Response.json(swaggerJson);
  } catch (e) {
    return Response.json({ error: "Swagger 불러오기 실패" }, { status: 500 });
  }
}
