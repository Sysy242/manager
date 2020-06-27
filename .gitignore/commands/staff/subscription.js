const Command = require("../../structures/Command.js"),
Discord = require("discord.js");

module.exports = class extends Command {
    constructor (client) {
        super(client, {
            name: "subscription",
            enabled: true,
            aliases: [ "sub" ],
            clientPermissions: [],
            permLevel: 4
        });
    }

    async run (message, args, data) {

        let guildID = args[0];
        if(!guildID) return message.error("Please specify a valid guild ID!");

        if(guildID.match(/(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li|com)|discordapp\.com\/invite)\/.+[a-z]/)){
            let invite = await this.client.fetchInvite(guildID);
            guildID = invite.channel.guild.id;
        }

        const guildDB = await this.client.database.fetchGuild(guildID);
        const guildJsons = await this.client.shard.broadcastEval(`
            let guild = this.guilds.cache.get('${guildID}');
            if(guild){
                [ guild.name, guild.iconURL() ]
            }
        `);
        const guildJson = guildJsons.find((r) => r);
        const guildData = (guildJson ? { name: guildJson[0], icon: guildJson[1] } : null) || {
            name: "Unknown Name",
            icon: ""
        }

        const description = guildDB.premium
        ? `This server is premium. Subscription will expire on ${this.client.functions.formatDate(new Date(guildDB.subscriptions[0].expiresAt), "MMM DD YYYY", message.guild.data.language)}.`
        : `This server is not premium.`

        const embed = new Discord.MessageEmbed()
        .setAuthor(`Subscription for ${guildData.name}`, guildData.icon)
        .setDescription(description)
        .setColor(this.client.config.color);

        for(let sub of guildDB.subscriptions){
            const payments = await this.client.database.getPaymentsForSubscription(sub.id);
            const subContent = payments.map((p) => `__**${p.type}**__\nUser: **${p.payer_discord_username}** (\`${p.payer_discord_id}\`)\nDate: **${this.client.functions.formatDate(new Date(p.created_at), "MMM D YYYY h:m:s A", "en-US")}**\nID: ${p.id}`).join('\n');
            embed.addField(`${sub.aboutToExpire ? this.client.config.emojis.idle : sub.active ? this.client.config.emojis.online : this.client.config.emojis.dnd} ${sub.label} (${sub.id})`, subContent);
        }

        message.channel.send(embed);

    }
};
