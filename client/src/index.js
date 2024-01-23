const axios = require("axios");
const notifier = require("node-notifier");
const {ipcRenderer} = require("electron")

let previousStatus = "Locked";
let errorNotified = false;

const updateStatusText = (status) => {
  const statusElement = document.getElementById("status");
  statusElement.innerText = status;

  if (status === "Locked" || status === "Error") {
    statusElement.style.color = "#bf544d";
    statusElement.style.borderColor = "#bf544d";
    if(status === "Error") {
      statusElement.innerText = "Error fetching status"
    }
  } else if (status === "Unlocked!") {
    statusElement.style.color = "#4dbf4d";
    statusElement.style.borderColor = "#4dbf4d";

  }
};

const muteAudio = () => {
  const audio = document.getElementById("audio");
  audio.pause();
};

const playAudio = () => {
  const audio = document.getElementById("audio");
  audio.volume = 0.1
  audio.play();
  ipcRenderer.send("audio-played")
};

const getStatus = async () => {
  const graphqlQuery = {
    operationName: "GetRealmStatusData",
    variables: {
      input: {
        compoundRegionGameVersionSlug: "classic1x-eu",
      },
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash:
          "b37e546366a58e211e922b8c96cd1ff74249f564a49029cc9737fef3300ff175",
      },
    },
  };

  try {
    const response = await axios.post(
      "https://worldofwarcraft.blizzard.com/graphql", 
      graphqlQuery
    );

    const livingFlame = response.data.data.Realms.find(
      (realm) => realm.name === "Living Flame"
    );

    return livingFlame.realmLockStatus?.isLockedForNewCharacters ? "Locked" : "Unlocked!"
  } catch (error) {
    return "Error"
  }
}

const checkLivingFlameLockStatus = async () => {
    const status = await getStatus();
    updateStatusText(status)

    if (status === "Unlocked!"){
      if (previousStatus === "Locked") { 
        notifier.notify({
          title: "Living Flame Status",
          message: "Server is unlocked!",
          sound: true,
        });

        playAudio()
      }
    } else if (status == "Error") {
      if(!errorNotified) {
        notifier.notify({
          title: "Error",
          message: "Failed to check Living Flame status",

        })
        errorNotified=true;
      }
    }
    previousStatus = status; 
};

ipcRenderer.on("mute-music", muteAudio)

document.getElementById("autolaunch").onclick = () => {
  ipcRenderer.send("autolaunch-toggled")
}

checkLivingFlameLockStatus()
setInterval(checkLivingFlameLockStatus, 5000);
