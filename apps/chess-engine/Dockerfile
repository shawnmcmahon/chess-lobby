FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY apps/chess-engine/ChessEngine.csproj apps/chess-engine/
RUN dotnet restore apps/chess-engine/ChessEngine.csproj
COPY apps/chess-engine/ apps/chess-engine/
RUN dotnet publish apps/chess-engine/ChessEngine.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
RUN apt-get update && apt-get install -y stockfish && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/publish .
ENV STOCKFISH_PATH=/usr/games/stockfish
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "ChessEngine.dll"]
