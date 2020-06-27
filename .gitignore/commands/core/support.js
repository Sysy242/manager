const Command = require("../../structures/Command.js"),
Constants = require("../../Constants");

module.exports = class extends Command {
    constructor (client) {
        super(client, {
            name: "support",
            enabled: true,
            aliases: [ "s" ],
            clientPermissions: [ "EMBED_LINKS" ],
            permLevel: 0
        });
    }

    async run (message, args, data) {
        message.sendT("core/support:CONTENT", {
            discord: Constants.Links.DISCORD
        });
    }

};
