# Use the official .NET 10 SDK to build the app
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy the csproj and restore dependencies
COPY ["DeckziApi.csproj", "./"]
RUN dotnet restore "DeckziApi.csproj"

# Copy the rest of the code and build
COPY . .
RUN dotnet publish "DeckziApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use the ASP.NET runtime to run the app
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose the port (Render/Railway will use this)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "DeckziApi.dll"]
