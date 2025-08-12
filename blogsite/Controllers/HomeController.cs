using blogsite.Data;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
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

        public IActionResult Index(bool showComments = false)
        {
            ViewData["ShowComments"] = showComments;
            return View();
        }
    }
}
