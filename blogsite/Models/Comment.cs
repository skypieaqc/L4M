using Microsoft.AspNetCore.Mvc;
using System;
using System.ComponentModel.DataAnnotations;

namespace blogsite.Models
{
    public class Comment
    {
        public int Id { get; set; }

        [MaxLength(100)]
        public string? Name { get; set; }

        [Required]
        [MaxLength(500)]
        public string Text { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
