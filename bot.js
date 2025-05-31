require('dotenv').config()
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js')
const fetch = require('node-fetch')
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const TOKEN = process.env.TOKEN
const CLIENT_ID = process.env.CLIENT_ID

const commands = [
  new SlashCommandBuilder()
    .setName('spam')
    .setDescription('Spamma uma mensagem')
    .addStringOption(opt => opt.setName('texto').setDescription('Texto (máx 2000)').setRequired(true))
    .addIntegerOption(opt => opt.setName('quantidade').setDescription('Quantas vezes').setRequired(true))
    .addIntegerOption(opt => opt.setName('velocidade').setDescription('Delay em ms').setRequired(true)),
  new SlashCommandBuilder()
    .setName('consultar_ip')
    .setDescription('Consulta dados de IP')
    .addStringOption(opt => opt.setName('ip').setDescription('Ex: 8.8.8.8').setRequired(true)),
  new SlashCommandBuilder()
    .setName('consultar_roblox')
    .setDescription('Consulta nick ou ID de jogador')
    .addStringOption(opt => opt.setName('usuario').setDescription('Nick ou ID').setRequired(true)),
].map(cmd => cmd.toJSON())

const rest = new REST({ version: '10' }).setToken(TOKEN)
rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
  .then(() => console.log('✅ Comandos registrados globalmente.'))
  .catch(console.error)

client.on('ready', () => {
  console.log(`🤖 Logado como ${client.user.tag}`)
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return
  const { commandName, options } = interaction

  if (commandName === 'spam') {
    const texto = options.getString('texto')
    const qtd = options.getInteger('quantidade')
    const vel = options.getInteger('velocidade')
    if (texto.length > 2000) return interaction.reply({ content: '❌ Texto excede 2000 caracteres.', ephemeral: true })
    await interaction.reply('✅ Iniciando spam...')
    for (let i = 0; i < qtd; i++) {
      await interaction.channel.send(texto).catch(() => {})
      await new Promise(r => setTimeout(r, vel))
    }
  }

  if (commandName === 'consultar_ip') {
    const ip = options.getString('ip')
    try {
      const res = await fetch(`http://ip-api.com/json/${ip}`)
      const data = await res.json()
      if (data.status === 'fail') return interaction.reply('❌ IP inválido.')
      interaction.reply(`📡 IP: \`${data.query}\`\n🌍 País: ${data.country} - ${data.city}\n📍 Região: ${data.regionName}\n🛰️ ISP: ${data.isp}`)
    } catch {
      interaction.reply('❌ Erro na consulta.')
    }
  }

  if (commandName === 'consultar_roblox') {
    const usuario = options.getString('usuario')
    try {
      const isID = /^\d+$/.test(usuario)
      const url = isID
        ? `https://users.roblox.com/v1/users/${usuario}`
        : `https://api.roblox.com/users/get-by-username?username=${usuario}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.errors) return interaction.reply('❌ Usuário não encontrado.')
      const id = data.id || data.Id
      const name = data.name || data.Username
      interaction.reply(`🧾 Roblox:\n👤 Nome: **${name}**\n🆔 ID: \`${id}\`\n🔗 https://www.roblox.com/users/${id}/profile`)
    } catch {
      interaction.reply('❌ Erro ao consultar Roblox.')
    }
  }
})

client.login(TOKEN)
