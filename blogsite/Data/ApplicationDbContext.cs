using blogsite.Models; // "YourProjectName" kısmını senin projenin namespace'ine göre değiştir
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace blogsite.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Comment> Comments { get; set; }
    }
}
