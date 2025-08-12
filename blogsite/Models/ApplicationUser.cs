using Microsoft.AspNetCore.Identity;

namespace blogsite.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? FullName { get; set; } // Örnek ekstra alan
        // Diğer özelleştirilmiş alanlar (örneğin: ProfilePicture, Bio vb.)
    }
}