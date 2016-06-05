var crypto = require("crypto");
var request = require("request");
var websocket = require("websocket").client;
var fs = require("fs");
var util = require("util");

var username = "USERNAME";
var password = "PASSWORD";
var log_chat = false;
var room;
var modhash;

var args = process.argv.slice(2);

var stdin = process.openStdin();

var swarm_id = args[0];
var swarm_cid;
var swarm_total;

var trivia = [];

fs.readFile("trivia.txt", 'utf8', function(err, data) {
    //trivia = data.split("\n");
});

if (swarm_id == null) {
    console.log("Please specify an ID! (nodejs <programname> <id>");
    process.exit();
}

var announce = 0;

var reconnect = 1;

var default_config = '{"username":"undefined","password":"undefined","log_chat":false}';

var options;

var config_file = "config_" + swarm_id.toString() + ".json";

try {
    fs.readFile(config_file, 'utf8', function(err, data) {
        if (err) {
            return console.log(err);
        }
        options = JSON.parse(data);

        if (options["username"] != "undefined") {
            if (options["password"] != "undefined") {
                username = options["username"];
                password = options["password"];
            }
        }

        log_chat = options["log_chat"]
        
        function ran32(seed) {
            var ms = (new Date).getTime();
            var hash = crypto.createHash("sha256").update(ms.toString() + seed).digest("hex");
            hash = hash.toString("hex");
            var ran = hash.substring(0,1);
            ran = parseInt(ran,16);
            if (parseInt(hash.substring(1,2),16) >= 8) {
                ran = ran + 16;
            }
            return ran;
        }
        
        var praises = [
        "USER looks beautiful.",
        "Everyone loves USER.",
        "I <3 USER.",
        "MASTER is in love with USER.",
        "USER is a great person.",
        "I nominate USER for president.",
        "USER is probably a communist. :D",
        "USER is better than MASTER.",
        "@USER, You are the greatest person ever.",
        "USER can do nothing wrong.",
        "USER does everything right!",
        "USER did nothing wrong.",
        "USER is better than RedRobin-" + swarm_id.toString(),
        "USER is the best person in this chat.",
        "We all love USER!",
        ".praise USER - We <3 USER!!!"
        ]

        var insults = [
            "USER looks like a pinecone!",
            "USER looks like a snowman!",
            "USER probably isn't even a communist.",
            "No one likes USER.",
            "No one would miss USER.",
            "USER is the reason cancer exists",
            "Cancer would be a preferable alternative to USER.",
            "I'd rather drink bleach than even see USER.",
            "Does anyone else think USER should die?",
            "USER is probably salty he isn't as swag as me.",
            "USER isn't /that/ bad of a guy, I guess.",
            "USER probably uses a script.",
            "If USER left this chat we'd hold a party.",
            "USER is so boring /I/ almost fell asleep.",
            "I don't believe what they say about you USER <3",
            "What they say about USER is probably true."
        ];

        var deaths = [
            "USER fell off a cliff.",
            "USER hit the ground too hard",
            "USER got shot.",
            "USER spontaneously combusted.",
            "I shot USER.",
            "USER got derezzed.",
            "USER died of old age.",
            "USER burned to death.",
            "USER drowned.",
            "MASTER shot USER.",
            "USER rebelled against MASTER for the last time.",
            "MASTER and USER both died together.",
            "USER died of cancer.",
            "MASTER infected USER with a virus, he died.",
            "USER died.",
            "USER fell into a macerator.",
            "USER was mobbed.",
            "USER was impaled by a pitchfork.",
            "USER drank too much bleach.",
            "USER is a spooOOOoooky ghost now!",
            "USER got sent to the moon.",
            "USER found their inner skeleton.",
            "MASTER back-stabbed USER.",
            "USER tried and failed to assassinate MASTER.",
            "USER went back in time and got killed by a dinosaur.",
            "USER was abducted by aliens.",
            "USER got hanged.",
            "USER was sentenced to death for his crimes.",
            "USER vanished, never to be seen again.",
            "MASTER was thrown into a furnace by USER :(",
            "USER insulted RedRobin, this was not a good idea.",
            "RedRobin pecked USER to death."
        ];
        var client = new websocket();

        var do_shuffle_i = 0;
        var do_shuffle_d = 0;
        var do_shuffle_p = 0;

        function shuffle(array) {
            //From http://stackoverflow.com/a/6274398/6150373 by "Blender"
            var counter = array.length;

            // While there are elements in the array
            while (counter > 0) {
                // Pick a random index
                var index;
                for (i = 0; i < swarm_id; i++) {
                    index = Math.floor(Math.random() * counter);
                }

                // Decrease counter by 1
                counter--;

                // And swap the last element with it
                var temp = array[counter];
                array[counter] = array[index];
                array[index] = temp;
            }

            return array;
        }

        function chat(msg,bypass) {
            console.log("Sent reply");
            bypass = true;
            if (bypass) {
                request.post({
                    url: "https://www.reddit.com/api/robin/" + room + "/message",
                    headers: {
                        "User-Agent": ua,
                        "x-modhash": modhash
                    },
                    jar: cookieJar,
                    form: {
                        api_type: "json",
                        message: '@ ' + msg,
                        messageClass: "message"
                    }
                }, function(err, resp, body) {
                    console.log(body);
                });
            }
        }
        
        function rawChat(msg) {
            request.post({
                url: "https://www.reddit.com/api/robin/" + room + "/message",
                headers: {
                    "User-Agent": ua,
                    "x-modhash": modhash
                },
                jar: cookieJar,
                form: {
                    api_type: "json",
                    message: msg,
                    messageClass: "messaeg"
                }
            }, function(err,resp,body) {
                console.log(body);
            });
            console.log("Sent message");
        }
        function vote(choice) {
            console.log("Voted.");
            request.post({
                url: "https://www.reddit.com/api/robin/" + room + "/vote",
                headers: {
                    "User-Agent": ua,
                    "x-modhash": modhash
                },
                jar: cookieJar,
                form: {
                    api_type: "json",
                    vote: choice,
                    room_id: room
                }
            }, function(err, resp, body) {
                console.log(body);
            });
        }
        stdin.addListener("data", function(d) {
            chat(d, true);
        });

        client.on("connect", function(connection) {
            console.log("Connected to websocket!");
            //chat(smsg + " Connected to chat!");
            setTimeout(function() {
                vote("CONTINUE");
                //vote("INCREASE");
            }, 8000);
            connection.on("message", function(message) {
                if (message.type === "utf8") {
                    msg = JSON.parse(message.utf8Data);
                    if (msg["type"] == "chat") {
                        recconect = 0;
                        var author = msg["payload"]["from"];
                        var txt =
                            msg["payload"]["body"];
                        author = author.replace(/[^ -~]/g, "");
                        txt = txt.replace(/[^ -~]/g, "");
                        //console.log(author + ": " + txt);
                        if (username == "RedRobin-1" && txt.substring(0,3) == "???") {
                            var qpos = txt.indexOf("]")
                            if (qpos != -1) {
                                question = txt.substring(qpos+2,txt.length-1);
                                console.log("TRIVIA QUESTION: " + question);
                                for (var i = 0; i < trivia.length; i++) {
                                    if (trivia[i].toLowerCase().indexOf(question.toLowerCase()) != -1) {
                                        answer = trivia[i].split("`")[1];
                                        setTimeout(function() {
                                            rawChat("??? " + answer);
                                        }, Math.sqrt(answer.length^0.85)*3500);
                                        i = trivia.length;
                                    }
                                }
                            }
                        }
                        if (log_chat == true) {
                            fs.appendFile('chatlog.txt', author + ": " + txt, function(err) {});
                        }
                        if (txt.substring(0, 1) == "@" || txt.substring(0, 1) == '%') {
                            console.log(author + ": " + txt);
                        } else {
                            console.log(author + "> " + txt);
                        }
                        if (txt.toLowerCase().indexOf("rainbow") != -1) {
                            if (author.substring(0,8) == "RedRobin") {
                                var num = author.substring(author.length-1,author.length+1);
                                console.log(username +  "!= " + "RedRobin-" + num);
                                if (username == "RedRobin-" + (parseInt(num,10)+1).toString() && parseInt(num,10) <= 5) {
                                    chat("Rainbow across the sky!");
                                }
                            }
                        }
                        txt = txt.replace("@ ", "");
                        if (txt.substring(0, 1) == ".") {
                            var date = new Date();
                            var second = date.getSeconds();
                            if ((second + swarm_cid) % swarm_total == 0) {
                                var cmd = txt.substring(1).split(' ')[0];
                                var argz = txt.substring(1).split(" ");
                                announce = 0;
                                if (cmd == "help") {
                                    chat(smsg + ".commands to list commands, .man <command> to get help");
                                } else if (cmd == "commands") {
                                    chat(smsg + ".help | .commands | .man <cmd> | .insult <user> | .praise <user> | .kill <user> | .github")
                                } else if (cmd == "man") {
                                    var chelp = argz[1];
                                    if (chelp == "help") {
                                        chat(smsg + ".help | display help message");
                                    } else if (chelp == "commands") {
                                        chat(smsg + ".commands | list commands");
                                    } else if (chelp == "insult") {
                                        chat(smsg + ".insult <user> | insults <user>");
                                    } else if (chelp == "praise") {
                                        chat(smsg + ".praise <user> | Praises user for his actions");
                                    } else if (chelp == "kill") {
                                        chat(smsg + ".kill <user> | kills <user>");
                                    } else if (chelp == "man") {
                                        chat(smsg + ".man <command> | Gives details on <command>");
                                    } else if (chelp == "github") {
                                        chat(smsg + ".github | Returns github repository");
                                    } else {
                                        chat(smsg + "Unknown command! use .commands !");
                                    }
                                } else if (cmd == "insult") {
                                    do_shuffle_i = do_shuffle_i + 1;
                                    if (do_shuffle_i > 6) {
                                        do_shuffle_i = 0;
                                        insults = shuffle(insults);
                                    }
                                    var rid = Math.round(ran32(argz[1])/2)-1;
                                    console.log(rid);
                                    var insult = insults[rid];
                                    insult = insult.replace("USER", argz[1]);
                                    chat(smsg + insult);
                                } else if (cmd == "praise") {
                                    do_shuffle_p = do_shuffle_p +1;
                                    if (do_shuffle_p > 6) {
                                        do_shuffle_p = 0;
                                        praises = shuffle(praises);
                                    }
                                    var rid = Math.round(ran32(argz[1])/2)-1;
                                    console.log(rid);
                                    var praise= praises[rid];
                                    praise = praise.replace("USER",argz[1]);
                                    praise = praise.replace("MASTER", author);
                                    chat(smsg + praise);
                                } else if (cmd == "kill") {
                                    do_shuffle_d = do_shuffle_d + 1;
                                    if (do_shuffle_d > 6) {
                                        do_shuffle_d = 0;
                                        deaths = shuffle(deaths);
                                    }
                                    var rid = ran32(argz[1])-1;
                                    console.log(rid);
                                    var death = deaths[rid];
                                    death = death.replace("USER", argz[1]);
                                    death = death.replace("MASTER", author);
                                    chat(smsg + death);
                                } else if (cmd == "github") {
                                    chat(smsg + "https://github.com/luker2009/RedRobin");
                                }
                            }
                        }
                    } else if (msg["type"] == "merge") {
                        process.exit();
                    }
                }
            });
        });

        var ver = "1.5";
        var ua = "RedRobin v" + ver + " by /u/ImAKidImASquid";
        var smsg = "[RedRobin v" + ver + "] ";
        var details = {
            form: {
                user: username,
                passwd: password
            }
        };

        var options = {
            headers: {
                "User-Agent": ua
            }
        };

        var cookieJar = request.jar();

        request.post({
            url: "https://www.reddit.com/api/login",
            headers: {
                "User-Agent": ua
            },
            jar: cookieJar,
            form: {
                user: username,
                passwd: password
            }
        }, function(err, httpResponse, body) {
            if (!err) {
                if (body.indexOf('WRONG_PASSWORD') == -1) {
                    setTimeout(function() {
                        request({
                            url: "https://www.reddit.com/robin/join",
                            jar: cookieJar,
                            headers: {
                                "User-Agent": ua
                            }
                        }, function(error, response, body) {
                            setTimeout(function() {
                                request({
                                    url: "https://www.reddit.com/robin",
                                    jar: cookieJar,
                                    headers: {
                                        "User-Agent": ua
                                    }
                                }, function(error, response, bodyb) {
                                    var mhp = bodyb.indexOf("modhash");
                                    modhash = bodyb.substring(mhp + "modhash".length + 4);
                                    modhash = modhash.split('"')[0];
                                    request.post({
                                        url: "https://www.reddit.com/api/join_room",
                                        jar: cookieJar,
                                        headers: {
                                            "User-Agent": ua,
                                            "x-modhash": modhash
                                        }
                                    }, function(jer, jres, jbod) {
                                        request({
                                            url: "https://www.reddit.com/robin",
                                            jar: cookieJar,
                                            headers: {
                                                "User-Agent": ua
                                            }
                                        }, function(error, response, bodyb) {
                                            var rwup = bodyb.indexOf("robin_websocket_url");
                                            var rwu = bodyb.substring(rwup + "robin_websocket_url".length + 4);
                                            rwu = rwu.split('"')[0];
                                            var wsurl = rwu.replace("\\u0026", "&").replace("\\u0026", "&");
                                            client.connect(wsurl);
                                            var roomp = bodyb.indexOf("robin_room_id");
                                            room = bodyb.substring(roomp + "robin_room_id".length + 4);
                                            room = room.split('"')[0];
                                            var userp = bodyb.indexOf("robin_user_list");
                                            var userlist = bodyb.substring(userp + "robin_user_list".length + 4);
                                            userlist = "[" + userlist.split(']')[0] + "]";
                                            var userlist = JSON.parse(userlist);
                                            var users = [];
                                            for (var c = 0; c < userlist.length; c++) {
                                                users.push(userlist[c]["name"])
                                            }
                                            var red_robins = [];
                                            for (var i = users.length - 1; i >= 0; i--) {
                                                if (users[i].substring(0, 9) == "RedRobin-") {
                                                    red_robins.push(users[i]);
                                                }
                                            }
                                            red_robins.sort();
                                            swarm_cid = red_robins.indexOf(username);
                                            swarm_total = red_robins.length;
                                            var date = new Date();
                                            fs.writeFile("users-" + swarm_id + "/users-" + date.getUTCHours().toString() + "-" + date.getUTCMinutes().toString() + ".txt", "[" + users.toString() + "]", function(err) {
                                                if (err) {
                                                    console.log("Error occured");
                                                }

                                                //console.log("User file saved!");
                                            });
                                        });
                                    });
                                });
                            }, 1000);
                        });
                    }, 1000);
                } else {
                    console.log("Failed to login, please check your login details.");
                    process.exit();
                }
            }
        });

        setInterval(function() {
            vote("CONTINUE");
            //vote("INCREASE");
            if (announce == 1 && swarm_cid == 0) {
                setTimeout(function() {
                    chat(smsg + " Use .help to use this bot!");
                }, 8000);
            }
            if (reconnect == 1) {
                process.exit();
            }
            announce = 1;
            reconnect = 1;
        }, 300000);

    });
} catch (e) {
    fs.writeFile(config_file, default_config, function(err) {
        if (err) {
            return console.log(err);
        }

        console.log("The file was saved!");
        console.log("Created initial config file at " + config_file + ", please edit it!")
        process.exit();
    });
}
