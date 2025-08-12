using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.StaticFiles; // Bu satýrý ekleyin
using Microsoft.Extensions.FileProviders;
using System.IO;
using blogsite.Data; // kendi namespace'ine göre
using blogsite.Models;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false; // Þifre kurallarýný özelleþtirin
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});
// EF Core: Veritabaný baðlantýsýný burada kur
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"))); // Sqlite kullanýyoruz

var app = builder.Build();

var provider = new FileExtensionContentTypeProvider();

// Özel MIME tipleri ekle
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

        // Development ortamýnda cache'i devre dýþý býrak
        if (app.Environment.IsDevelopment())
        {
            ctx.Context.Response.Headers.Append("Cache-Control", "no-cache");
        }
    }
});
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.UseCors("AllowAll");
app.Run();
