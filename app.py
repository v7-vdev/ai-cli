```python
import discord
from discord.ext import commands

token = "YOUR_DISCORD_BOT_TOKEN"

intents = discord.Intents.default()
intents.typing = False
intents.presences = False

bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"We have logged in as {bot.user}")

@bot.command(name="ping")
async def ping(ctx):
    await ctx.send("Pong!")

@bot.command(name="test")
async def test(ctx, arg: str):
    await ctx.send(arg)

bot.run(token)
```

Replace `"YOUR_DISCORD_BOT_TOKEN"` with your actual Discord bot token.