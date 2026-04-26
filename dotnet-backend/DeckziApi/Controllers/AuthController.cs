using DeckziApi.Data;
using DeckziApi.Models;
using DeckziApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeckziApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtService _jwt;

    public AuthController(AppDbContext db, JwtService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    public record RegisterRequest(string Username, string Email, string Password);
    public record LoginRequest(string Email, string Password);

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email))
            return Conflict(new { message = "Email already registered" });

        var user = new User
        {
            Username = req.Username,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            DisplayName = req.Username,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _jwt.GenerateToken(user.Id, user.Username);
        return CreatedAtAction(nameof(Register), new
        {
            access_token = token,
            token_type = "bearer",
            username = user.Username
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid credentials" });

        var token = _jwt.GenerateToken(user.Id, user.Username);
        return Ok(new { 
            token = token,
            access_token = token,
            token_type = "bearer",
            username = user.Username,
            message = "Login successful" 
        });
    }
}
