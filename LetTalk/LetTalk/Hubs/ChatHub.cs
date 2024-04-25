using Microsoft.AspNetCore.SignalR;

namespace LetTalk.Hubs;

public interface IChatHub
{
    Task ReceiveMessage(string message);
}

public class ChatHub : Hub<IChatHub>
{
    public override Task OnConnectedAsync()
    {
        return base.OnConnectedAsync();
    }

    public async Task SendMessage(string message)
    {
        await Clients.All.ReceiveMessage(message);
    }
}