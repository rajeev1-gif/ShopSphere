using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using ShopSphere.Api.Models;

namespace ShopSphere.Api.Controllers;

public record RegisterRequest(string DisplayName, string Email, string Password);
public record LoginRequest(string Email, string Password);

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    IConfiguration configuration) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            request.Password.Length < 8)
            return BadRequest(new { message = "Enter a name, valid email, and password of at least 8 characters." });

        var user = new ApplicationUser
        {
            UserName = request.Email.Trim(),
            Email = request.Email.Trim(),
            DisplayName = request.DisplayName.Trim()
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = string.Join(" ", result.Errors.Select(e => e.Description)) });

        // Public registration creates customers only; never accept a role from the request.
        await userManager.AddToRoleAsync(user, "Customer");
        return Ok(new { message = "Registration successful. You can now log in." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
            return Unauthorized(new { message = "Invalid email or password." });

        var roles = await userManager.GetRolesAsync(user);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new(ClaimTypes.Name, user.DisplayName),
            new(ClaimTypes.NameIdentifier, user.Id)
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

      
        var jwtKey = configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "JWT signing key is not configured.");

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey));
        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return Ok(new
        {
            accessToken = new JwtSecurityTokenHandler().WriteToken(token),
            expiresAtUtc = token.ValidTo,
            displayName = user.DisplayName,
            roles
        });
    }
}
