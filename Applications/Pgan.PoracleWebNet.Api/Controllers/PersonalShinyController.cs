using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Pgan.PoracleWebNet.Api.Controllers;

[Route("api/personal-shiny")]
public class PersonalShinyController(IHttpClientFactory clients, IConfiguration configuration) : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] bool refresh = false)
    {
        var address = configuration["Poracle:ApiAddress"]?.TrimEnd('/');
        using var request = new HttpRequestMessage(HttpMethod.Get,
            $"{address}/api/humans/{Uri.EscapeDataString(this.UserId)}/personalShiny?refresh={(refresh ? "1" : "0")}");
        request.Headers.Add("X-Poracle-Secret", configuration["Poracle:ApiSecret"]);
        using var response = await clients.CreateClient().SendAsync(request, this.HttpContext.RequestAborted);
        if (!response.IsSuccessStatusCode) return this.StatusCode(503, new { error = "Unable to load shiny access" });
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return this.Ok(document.RootElement.Clone());
    }
}
