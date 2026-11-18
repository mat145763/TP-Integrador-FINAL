using Microsoft.EntityFrameworkCore;
using TuProyecto.Dominio; // Asegúrate de que coincida con el namespace de tus clases (ej: TuProyecto.Dominio o TP_Integrador.Dominio)

namespace TuProyecto.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Heroe> Heroes => Set<Heroe>();
        public DbSet<Equipo> Equipos => Set<Equipo>();
        public DbSet<Incidente> Incidentes => Set<Incidente>();
        public DbSet<Zona> Zonas => Set<Zona>();
        public DbSet<Poder> Poderes => Set<Poder>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. Configurar los Enums para que se guarden como Texto (String) en MySQL en lugar de números
            modelBuilder.Entity<Heroe>()
                .Property(h => h.Estado)
                .HasConversion<string>();

            modelBuilder.Entity<Equipo>()
                .Property(e => e.EstadoActual)
                .HasConversion<string>();

            modelBuilder.Entity<Incidente>()
                .Property(i => i.EstadoActual)
                .HasConversion<string>();

            // 2. Configurar la relación Muchos a Muchos entre Equipo y Heroe
            modelBuilder.Entity<Equipo>()
                .HasMany(e => e.Heroes)
                .WithMany()
                .UsingEntity(j => j.ToTable("EquipoHeroes"));

            // 3. Configurar la relación Muchos a Muchos entre Equipo y Zona
            modelBuilder.Entity<Equipo>()
                .HasMany(e => e.Zonas)
                .WithMany()
                .UsingEntity(j => j.ToTable("EquipoZonas"));

            // 4. Configurar la relación Muchos a Muchos entre Heroe y Poder
            modelBuilder.Entity<Heroe>()
                .HasMany(h => h.Poderes)
                .WithMany()
                .UsingEntity(j => j.ToTable("HeroePoderes"));
        }
    }
}