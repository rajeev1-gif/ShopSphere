using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ShopSphere.Api.Data;
using ShopSphere.Api.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Database connection string is not configured.");

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = true;
    options.Password.RequireUppercase = true;
    options.User.RequireUniqueEmail = true;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<AppDbContext>()
.AddSignInManager();

var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT signing key is not configured.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
    policy.WithOrigins(builder.Configuration["FrontendOrigin"] ?? "http://localhost:5173")
          .AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// For a local prototype only. Use reviewed migrations in a shared/demo deployment.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();

    // Seed roles so public registration can safely assign the Customer role.
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    foreach (var roleName in new[] { "Customer", "Admin" })
    {
        if (!await roleManager.RoleExistsAsync(roleName))
            await roleManager.CreateAsync(new IdentityRole(roleName));
    }
    if (!await db.Products.AnyAsync())
    {
        db.Products.AddRange(
            new Product { Name = "Studio Headphones", Description = "Wireless over-ear headphones with clear, balanced sound.", Category = "Electronics", Price = 129.00m, Stock = 24, ImageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700" },
            new Product { Name = "Everyday Backpack", Description = "A durable everyday backpack with a clean silhouette.", Category = "Accessories", Price = 74.50m, Stock = 18, ImageUrl = "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700" },
            new Product { Name = "Minimal Watch", Description = "A minimal timepiece for workdays and weekends.", Category = "Accessories", Price = 159.00m, Stock = 12, ImageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700" },
            new Product { Name = "Desk Lamp", Description = "Warm, focused lighting for a calmer workspace.", Category = "Home", Price = 48.00m, Stock = 30, ImageUrl = "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700" }
        );
        await db.SaveChangesAsync();
    }
}

app.Run();
