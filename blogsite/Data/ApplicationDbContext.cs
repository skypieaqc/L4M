using blogsite.Models; // "YourProjectName" kısmını senin projenin namespace'ine göre değiştir
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore; // Bu namespace'i ekleyin
using Microsoft.EntityFrameworkCore;

namespace blogsite.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
                   : base(options)
        {
        }

        public DbSet<Comment> Comments { get; set; }

        // İsteğe bağlı: Model konfigürasyonları (override OnModelCreating)
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder); // Identity tabloları için gerekli
            // Özel model konfigürasyonlarınızı buraya ekleyebilirsiniz
        }
    }
}
