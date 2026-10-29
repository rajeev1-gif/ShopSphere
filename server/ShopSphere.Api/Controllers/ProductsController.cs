using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopSphere.Api.Data;

namespace ShopSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? category)
    {
        var query = db.Products.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search) || p.Description.Contains(search));

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.Category == category);

        var products = await query.OrderBy(p => p.Name).ToListAsync();
        return Ok(products);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        return product is null ? NotFound(new { message = "Product not found." }) : Ok(product);
    }
}
