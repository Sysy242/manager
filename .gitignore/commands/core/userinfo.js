const Command = require("../../structures/Command.js"),
moment = require("moment"),
Discord = require("discord.js");

module.exports = class extends Command {
    constructor (client) {
        super(client, {
            name: "userinfo",
            enabled: true,
            aliases: [ "ui", "info", "infos" ],
            clientPermissions: [ "EMBED_LINKS" ],
            permLevel: 0
        });
    }

    async run (message, args, data) {

        // Fetch user and member
        const user = message.mentions.users.first() || await this.client.resolveUser(args.join(" ")) || message.author;
        const member = await message.guild.members.fetch(user.id).catch(() => {});
        const memberData = member ? await this.client.database.fetchMember(member.id, member.guild.id) : null;

        moment.locale(data.guild.language.substr(0, 2));
        const creationDate = moment(user.createdAt, "YYYYMMDD").fromNow();
        const joinDate = member ? moment(member.joinedAt, "YYYYMMDD").fromNow() : null;

        const embed = new Discord.MessageEmbed()
        .setAuthor(message.translate("core/userinfo:TITLE", {
            username: user.tag,
            userID: user.id
        }), user.displayAvatarURL())
        .addField(message.translate("core/userinfo:BOT_TITLE"), user.bot ? message.translate("common:YES") : message.translate("common:NO"), true)
        .addField(message.translate("core/userinfo:CREATED_AT_TITLE"), creationDate.charAt(0).toUpperCase() + creationDate.substr(1, creationDate.length), true)
        .setColor(data.color)
        .setFooter(data.footer);
        
        if(member){
            const joinData = memberData.joinData || (memberData.invitedBy ? { type: "normal", invite: { inviter: memberData.joinData.invitedBy } } : { type: "unknown" } );
            let joinWay = message.translate("core/userinfo:JOIN_WAY_UNKNOWN", {
                user: user.username
            });
            if(joinData.type === "normal" && joinData.inviteData){
                const inviter = await this.client.users.fetch(joinData.inviteData.inviter).catch(() => {});
                joinWay = inviter.tag;
            } else if(joinData.type === "vanity"){
                joinWay = message.translate("core/userinfo:JOIN_WAY_VANITY");
            } else if(joinData.type === "oauth" || user.bot){
                joinWay = message.translate("core/userinfo:JOIN_WAY_OAUTH");
            }
            const guild = await message.guild.fetch();
            const members = guild.members.cache.array().sort((a,b) => a.joinedTimestamp - b.joinedTimestamp);
            const joinPos = members.map((u) => u.id).indexOf(member.id);
            const previous = members[joinPos - 1] ? members[joinPos - 1].user : null;
            const next = members[joinPos + 1] ? members[joinPos + 1].user : null;
            embed.addField(message.translate("core/userinfo:JOINED_AT_TITLE"), joinDate.charAt(0).toUpperCase() + joinDate.substr(1, joinDate.length), true)
            .addField(message.translate("core/userinfo:INVITES_TITLE"), data.guild.blacklistedUsers.includes(member.id) ? message.translate("admin/blacklist:BLACKLISTED", {
                username: member.user.tag
            }) : message.translate("core/invite:MEMBER_CONTENT", {
                username: member.user.username,
                inviteCount: memberData.calculatedInvites,
                regularCount: memberData.regular,
                bonusCount: memberData.bonus,
                fakeCount: memberData.fake > 0 ? `-${memberData.fake}` : memberData.fake,
                leavesCount: memberData.leaves > 0 ? `-${memberData.leaves}` : memberData.leaves
            }))
            .addField(message.translate("core/userinfo:JOIN_WAY_TITLE"), joinWay)
            .addField(message.translate("core/userinfo:JOIN_ORDER_TITLE"), `${previous ? `**${previous.tag}** > ` : ""}**${user.tag}**${next ? ` > **${next.tag}**` : ""}`);
        }

        if(memberData.invitedUsers){
            const users = [];
            await this.client.functions.asyncForEach(memberData.invitedUsers, async (user) => {
                const fetchedUser = message.guild.member(user);
                if(fetchedUser) users.push("`"+fetchedUser.user.tag+"`");
            });
            let nobody = users.length === 0;
            let andMore = false;
            if(users.length > 20){
                andMore = true;
                users.length = 19;
            }
            embed.addField(message.translate("core/userinfo:INVITED_TITLE"),
                nobody ? message.translate("core/userinfo:NO_INVITED_USERS") :
                (andMore ? message.translate("core/userinfo:INVITED_USERS_MORE", {
                    list: users.join(", ")
                }) :
                users.join(", ")));
        }
        
        message.channel.send(embed);
    }

};
