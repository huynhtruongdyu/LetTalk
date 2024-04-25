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

    public async Task SendMessage(string roomId, string message)
    {
        await Clients.Group(roomId).ReceiveMessage(message);
    }

    public async Task JoinRoom(string roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
    }
}