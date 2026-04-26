using System.Security.Claims;
using DeckziApi.Data;
using DeckziApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeckziApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserProfileController : ControllerBase
{
    private readonly AppDbContext _db;

    public UserProfileController(AppDbContext db)
    {
        _db = db;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException());

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.DisplayName,
            user.Preferences,
            user.CreatedAt,
        });
    }

    public record UpdateProfileRequest(string? DisplayName, string? Preferences);

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
    {
        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (req.DisplayName != null) user.DisplayName = req.DisplayName;
        if (req.Preferences != null) user.Preferences = req.Preferences;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.DisplayName,
            user.Preferences,
        });
    }
}
