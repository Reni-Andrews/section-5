using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DeckziApi.Models;

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("username")]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(100)]
    [Column("display_name")]
    public string? DisplayName { get; set; }

    [Column("preferences", TypeName = "json")]
    public string Preferences { get; set; } = "{}";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
