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
            // Veritaban�ndan t�m yorumlar� �ekiyoruz
            var comments = _context.Comments.ToList();

            // Bo� liste d�nebilir ama kesinlikle null olmaz
            return View(comments);
        }
    }
}
