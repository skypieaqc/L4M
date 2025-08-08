using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.StaticFiles; // Bu sat�r� ekleyin
using Microsoft.Extensions.FileProviders;
using System.IO;
using blogsite.Data; // kendi namespace'ine g�re

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// EF Core: Veritaban� ba�lant�s�n� burada kur
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"))); // Sqlite kullan�yoruz

var app = builder.Build();

var provider = new FileExtensionContentTypeProvider();

// �zel MIME tipleri ekle
provider.Mappings[".glb"] = "model/gltf-binary";
provider.Mappings[".gltf"] = "model/gltf+json";
provider.Mappings[".bin"] = "application/octet-stream";

// middleware
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = provider,
    OnPrepareResponse = ctx =>
    {
        // Cache-Control header (1 saat cache)
        ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=3600");

        // Development ortam�nda cache'i devre d��� b�rak
        if (app.Environment.IsDevelopment())
        {
            ctx.Context.Response.Headers.Append("Cache-Control", "no-cache");
        }
    }
});
app.UseRouting();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
