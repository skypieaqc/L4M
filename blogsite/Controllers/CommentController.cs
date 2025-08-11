using Microsoft.AspNetCore.Mvc;
using blogsite.Data;
using blogsite.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
namespace blogsite.Controllers
{
    public class CommentController : Controller
    {
        private readonly ApplicationDbContext _context;

        public CommentController(ApplicationDbContext context)
        {
            _context = context;
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Add(Comment comment)
        {
            if (ModelState.IsValid)
            {
                _context.Comments.Add(comment);
                await _context.SaveChangesAsync();
                return Json(new { success = true });
            }

            return Json(new
            {
                success = false,
                errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetComments()
        {
            var comments = await _context.Comments
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
            return Json(comments);
        }
    }
}
