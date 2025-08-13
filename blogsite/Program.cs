using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.StaticFiles; // Bu satırı ekleyin
using Microsoft.Extensions.FileProviders;
using System.IO;
using blogsite.Data; // kendi namespace'ine göre
using blogsite.Models;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.Configure<IdentityOptions>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
});

builder.Services.ConfigureApplicationCookie(options =>
{
    options.LogoutPath = "/Account/Logout";
    options.AccessDeniedPath = "/Account/AccessDenied";
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminPolicy", policy =>
        policy.RequireAuthenticatedUser()
              .RequireRole("Admin")
              .RequireAssertion(context =>
                  context.User.HasClaim(c => c.Type == "IsActive" && c.Value == "true")));
});

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false; // Şifre kurallarını özelleştirin
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

builder.Services.AddRazorPages();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});
// EF Core: Veritabanı bağlantısını burada kur
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"))); // Sqlite kullanıyoruz

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

        // Development ortamında cache'i devre dışı bırak
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


using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        // Veritabanı yoksa oluştur
        context.Database.EnsureCreated();

        // Rolleri ekle
        string[] roles = ["Admin", "User"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // MEVCUT KULLANICIYA ADMIN YETKİSİ VER
        var existingUser = await userManager.FindByEmailAsync("ahmetyunus30q@gmail.com");
        if (existingUser != null)
        {
            // Kullanıcı zaten varsa sadece admin rolü ekleyelim
            if (!await userManager.IsInRoleAsync(existingUser, "Admin"))
            {
                await userManager.AddToRoleAsync(existingUser, "Admin");
                Console.WriteLine($"✅ Kullanıcı {existingUser.Email} admin yapıldı!");
            }
            else
            {
                Console.WriteLine($"ℹ️ Kullanıcı zaten admin");
            }
        }
        else
        {
            Console.WriteLine("❌ ahmetyunus30q@gmail.com adresine sahip kullanıcı bulunamadı");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("❌ Seed verileri eklenirken hata: " + ex.Message);
    }
}

app.MapControllers();
app.MapRazorPages();
app.Run();
