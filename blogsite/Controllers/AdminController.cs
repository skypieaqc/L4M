using blogsite.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // ToListAsync() için gerekli
using System;
using System.Linq;
using System.Threading.Tasks;

[Authorize(Roles = "Admin")]
public class AdminController : Controller
{
    private readonly UserManager<ApplicationUser> _userManager;

    public AdminController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    // Dashboard Action'ı
    public async Task<IActionResult> Dashboard()
    {
        var users = await _userManager.Users
            .Select(u => new UserViewModel
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                PasswordHash = u.PasswordHash,
                LockoutEnd = u.LockoutEnd,
                IsAdmin = _userManager.IsInRoleAsync(u, "Admin").Result
            })
            .ToListAsync();

        return View(users);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> MakeAdmin(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        var result = await _userManager.AddToRoleAsync(user, "Admin");
        if (!result.Succeeded)
        {
            TempData["ErrorMessage"] = "Admin yapma işlemi başarısız oldu";
        }

        return RedirectToAction(nameof(Dashboard));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleAdminRole(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        if (await _userManager.IsInRoleAsync(user, "Admin"))
        {
            // Admin kullanıcı sayısını kontrol et (son admini kaldırmayı önle)
            var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
            if (adminUsers.Count <= 1)
            {
                TempData["ErrorMessage"] = "Son admin kaldırılamaz!";
                return RedirectToAction(nameof(Dashboard));
            }
            await _userManager.RemoveFromRoleAsync(user, "Admin");
        }
        else
        {
            await _userManager.AddToRoleAsync(user, "Admin");
        }

        return RedirectToAction(nameof(Dashboard));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var currentUser = await _userManager.GetUserAsync(User);
        var userToDelete = await _userManager.FindByIdAsync(userId);

        if (userToDelete == null) return NotFound();

        // Kendi hesabını silmeyi önle
        if (userToDelete.Id == currentUser.Id)
        {
            TempData["ErrorMessage"] = "Kendi hesabınızı silemezsiniz!";
            return RedirectToAction(nameof(Dashboard));
        }

        var result = await _userManager.DeleteAsync(userToDelete);
        if (!result.Succeeded)
        {
            TempData["ErrorMessage"] = "Silme işlemi başarısız oldu";
        }

        return RedirectToAction(nameof(Dashboard));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ResetPassword(string userId, string newPassword, string confirmPassword)
    {
        if (newPassword != confirmPassword)
        {
            TempData["ErrorMessage"] = "Şifreler uyuşmuyor!";
            return RedirectToAction(nameof(Dashboard));
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        // Mevcut şifreyi sıfırla
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, newPassword);

        if (!result.Succeeded)
        {
            TempData["ErrorMessage"] = string.Join(", ", result.Errors.Select(e => e.Description));
        }
        else
        {
            TempData["SuccessMessage"] = "Şifre başarıyla sıfırlandı";
        }

        return RedirectToAction(nameof(Dashboard));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleUserLock(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        if (user.LockoutEnd?.UtcDateTime > DateTime.UtcNow)
        {
            // Kilidi aç
            await _userManager.SetLockoutEndDateAsync(user, null);
        }
        else
        {
            // 30 gün kilit
            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddDays(30));
        }

        return RedirectToAction(nameof(Dashboard));
    }

}

// ViewModel sınıfını aynı dosyada veya ayrı bir dosyada tanımlayın
public class UserViewModel
{
    public string Id { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public DateTimeOffset? LockoutEnd { get; set; }
    public bool IsAdmin { get; set; }
}