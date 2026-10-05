using Microsoft.EntityFrameworkCore;
using Pgan.PoracleWebNet.Core.Abstractions.Repositories;
using Pgan.PoracleWebNet.Core.Mappings;
using Pgan.PoracleWebNet.Core.Models;
using Pgan.PoracleWebNet.Data;
using Pgan.PoracleWebNet.Data.Entities;

namespace Pgan.PoracleWebNet.Core.Repositories;

public class PwebSettingRepository(PoracleContext context) : IPwebSettingRepository
{
    private readonly PoracleContext _context = context;

    public async Task<IEnumerable<PwebSetting>> GetAllAsync()
    {
        // Fresh PoracleNG installs have no legacy PoracleJS settings table.
        var exists = await this._context.Database.SqlQueryRaw<int>(
            "SELECT COUNT(*) AS Value FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() " +
            "AND TABLE_NAME = 'pweb_settings'").SingleAsync();
        if (exists == 0) return [];
        var entities = await this._context.PwebSettings.ToListAsync();
        return entities.Select(e => e.ToModel());
    }

    public async Task<PwebSetting?> GetByKeyAsync(string key)
    {
        var entity = await this._context.PwebSettings
            .FirstOrDefaultAsync(s => s.Setting == key);

        return entity is null ? null : entity.ToModel();
    }

    public async Task<PwebSetting> CreateOrUpdateAsync(PwebSetting setting)
    {
        var entity = await this._context.PwebSettings
            .FirstOrDefaultAsync(s => s.Setting == setting.Setting);

        if (entity is null)
        {
            entity = setting.ToEntity();
            this._context.PwebSettings.Add(entity);
        }
        else
        {
            setting.ApplyTo(entity);
        }

        await this._context.SaveChangesAsync();
        return entity.ToModel();
    }

    public async Task<bool> DeleteAsync(string key)
    {
        var entity = await this._context.PwebSettings
            .FirstOrDefaultAsync(s => s.Setting == key);

        if (entity is null)
        {
            return false;
        }

        this._context.PwebSettings.Remove(entity);
        await this._context.SaveChangesAsync();
        return true;
    }
}
