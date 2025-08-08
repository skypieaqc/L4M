using blogsite.Data;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using blogsite.Data;
using blogsite.Models;

namespace YourProjectName.Controllers
{
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _context;

        public HomeController(ApplicationDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            // Veritabanýndan tüm yorumlarý çekiyoruz
            var comments = _context.Comments.ToList();

            // Boþ liste dönebilir ama kesinlikle null olmaz
            return View(comments);
        }
    }
}
