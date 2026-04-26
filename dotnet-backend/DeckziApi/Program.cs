using System.Text;
using DeckziApi.Data;
using DeckziApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── Services ──────────────────────────────────────────────────────────────────

builder.Services.AddControllers();
builder.Services.AddScoped<JwtService>();

// MySQL via EF Core
var connStr = builder.Configuration.GetConnectionString("Default")
    ?? "server=localhost;port=3306;database=deckzi_db;user=root;password=";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        connStr, 
        ServerVersion.AutoDetect(connStr),
        opt => opt.EnableRetryOnFailure()
    ));

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "changeme_super_secret";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization();

// CORS
// Change this part:
builder.Services.AddCors(opt =>
    opt.AddPolicy("AllowAll", policy => // Added a name "AllowAll"
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod()));
// ── App ───────────────────────────────────────────────────────────────────────

var app = builder.Build();

// Auto-create tables on startup (dev convenience)
using (var scope = app.Services.CreateScope())
{
    try 
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        Console.WriteLine($">>> WARNING: Could not connect to MySQL. Error: {ex.Message}");
        Console.WriteLine(">>> The .NET backend will still run, but Login/Register/Profile will fail until MySQL is started.");
    }
}

app.UseCors("AllowAll"); // Pass the name here
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/", () => new { status = "ok", service = "Deckzi .NET Backend" });
app.MapGet("/health", () => new { status = "healthy" });

app.Run();
