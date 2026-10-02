//Variables
let currentSong = new Audio();
let songs = [];
let songUL;
let currentFolder;
let currentSongIndex = 0;

let isPause = true;
let isLoop = false;
let isShuffle = false;

let shuffleBtn = document.getElementById("shuffle");

// Convert seconds into MM:SS
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}

// Load songs from a selected folder
async function getSongs(folder) {
    try {
        currentFolder = folder;

        const response = await fetch("/js/songs.json");

        if (!response.ok) {
            throw new Error(`Failed to load songs.json: ${response.status}`);
        }

        const data = await response.json();

        songs = data[folder] || [];

        currentSongIndex = 0;

        songUL = document.querySelector(".song-list ul");

        if (!songUL) {
            console.error("Song list element not found");
            return;
        }

        songUL.innerHTML = "";

        if (songs.length === 0) {
            songUL.innerHTML = "<li>No songs found in this album.</li>";
            return;
        }

        // Generate the song list
        songs.forEach((song, index) => {
            const li = document.createElement("li");

            li.innerHTML = `
                <img class="invert" src="assets/music.svg" alt="music">

                <div class="info">
                    <div>${song.title}</div>
                </div>

                <div class="play-now">
                    <span>Play Now</span>
                    <img
                        class="invert"
                        src="assets/play-button.svg"
                        alt="play-button"
                    >
                </div>
            `;

            // Play the clicked song
            li.addEventListener("click", () => {
                currentSongIndex = index;
                playMusic(songs[currentSongIndex], false);
            });

            songUL.appendChild(li);
        });
    } catch (error) {
        console.error("Error loading songs:", error);
    }
}

// Play or pause a selected track
async function playMusic(track, pause = false) {
    if (!track || !track.url) {
        console.error("Invalid song or missing song URL:", track);
        return;
    }

    const trackIndex = songs.findIndex(
        song => song.url === track.url
    );

    if (trackIndex !== -1) {
        currentSongIndex = trackIndex;
    }

    // Avoid resetting the audio when toggling playback
    if (currentSong.src !== new URL(track.url, document.baseURI).href) {
        currentSong.src = track.url;
    }

    const songInfo = document.querySelector(".song-info");
    const songTime = document.querySelector(".song-time");

    if (songInfo) {
        songInfo.textContent = track.title;
    }

    if (songTime) {
        songTime.textContent = "00:00 / 00:00";
    }

    if (pause) {
        currentSong.pause();
        isPause = true;

        if (play) {
            play.src = "assets/play-button.svg";
        }

        return;
    }

    try {
        await currentSong.play();

        isPause = false;

        if (play) {
            play.src = "assets/pause.svg";
        }
    } catch (error) {
        isPause = true;

        if (play) {
            play.src = "assets/play-button.svg";
        }

        console.error("Unable to play song:", error);
    }
}

// Display album cards
async function displayAlbums() {
    try {
        const response = await fetch("/js/albums.json");

        if (!response.ok) {
            throw new Error(`Failed to load albums.json: ${response.status}`);
        }

        const data = await response.json();

        const cardContainer = document.querySelector(".card-container");

        if (!cardContainer) {
            console.error("Album card container not found");
            return;
        }

        cardContainer.innerHTML = "";

        data.forEach(album => {
            const card = document.createElement("div");

            card.className = "card";
            card.dataset.folder = album.folder;

            card.innerHTML = `
                <div class="play">
                    <img src="assets/play-button.svg" alt="play-button">
                </div>

                <img class="coverImg" src="${album.cover}" alt="cover">

                <h2>${album.title}</h2>
                <p>${album.description}</p>
            `;

            card.addEventListener("click", async () => {
                const folder = card.dataset.folder;

                await getSongs(folder);

                if (songs.length > 0) {
                    await playMusic(songs[0], false);
                }

                // Close the sidebar on small screens
                const leftSidebar = document.querySelector(".left");

                if (leftSidebar && window.innerWidth <= 768) {
                    leftSidebar.style.left = "-100%";
                }
            });

            cardContainer.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading albums:", error);
    }
}

// Main player setup
async function main() {
    // Load the default playlist
    await getSongs("Anime");

    // Display albums
    await displayAlbums();

    // Previous song
    if (previous) {
        previous.addEventListener("click", () => {
            if (!songs.length) return;

            currentSongIndex =
                (currentSongIndex - 1 + songs.length) % songs.length;

            playMusic(songs[currentSongIndex], false);
        });
    }

    // Next song
    if (next) {
        next.addEventListener("click", () => {
            playNextSong();
        });
    }

    // Play/pause button
    if (play) {
        play.addEventListener("click", async () => {
            if (currentSong.paused) {
                if (!currentSong.src && songs.length > 0) {
                    await playMusic(songs[currentSongIndex], false);
                } else {
                    try {
                        await currentSong.play();
                        isPause = false;
                        play.src = "assets/pause.svg";
                    } catch (error) {
                        console.error("Playback failed:", error);
                    }
                }
            } else {
                currentSong.pause();
                isPause = true;
                play.src = "assets/play-button.svg";
            }
        });
    }

    // Update playback time and seek indicator
    currentSong.addEventListener("timeupdate", () => {
        const songTime = document.querySelector(".song-time");
        const circle = document.querySelector(".circle");

        if (songTime) {
            songTime.textContent =
                `${secondsToMinutesSeconds(currentSong.currentTime)} / ` +
                `${secondsToMinutesSeconds(currentSong.duration)}`;
        }

        if (
            circle &&
            Number.isFinite(currentSong.duration) &&
            currentSong.duration > 0
        ) {
            circle.style.left =
                `${(currentSong.currentTime / currentSong.duration) * 100}%`;
        }
    });

    // Keep the play/pause icon synchronized
    currentSong.addEventListener("play", () => {
        isPause = false;

        if (play) {
            play.src = "assets/pause.svg";
        }
    });

    currentSong.addEventListener("pause", () => {
        isPause = true;

        if (play) {
            play.src = "assets/play-button.svg";
        }
    });

    // Seek bar
    const seekBar = document.querySelector(".seek-bar");

    if (seekBar) {
        seekBar.addEventListener("click", event => {
            if (
                !Number.isFinite(currentSong.duration) ||
                currentSong.duration <= 0
            ) {
                return;
            }

            const rect = seekBar.getBoundingClientRect();

            const percent = Math.max(
                0,
                Math.min(1, (event.clientX - rect.left) / rect.width)
            );

            currentSong.currentTime = currentSong.duration * percent;

            const circle = document.querySelector(".circle");

            if (circle) {
                circle.style.left = `${percent * 100}%`;
            }
        });
    }

    // Open sidebar
    const hamburger = document.querySelector(".hamburger");

    if (hamburger) {
        hamburger.addEventListener("click", () => {
            document.querySelector(".left").style.left = "0";
        });
    }

    // Close sidebar
    const closeBtn = document.querySelector(".close-btn");

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            document.querySelector(".left").style.left = "-100%";
        });
    }

    // Volume control
    const volumeBar = document.querySelector(".volume-bar");

    if (volumeBar) {
        // Set initial volume from the slider
        currentSong.volume = Number(volumeBar.value) / 100;

        volumeBar.addEventListener("input", event => {
            const volume = Number(event.target.value) / 100;

            currentSong.volume = Math.max(0, Math.min(1, volume));

            const volumeIcon = document
                .querySelector(".volume")
                ?.querySelector("img");

            if (!volumeIcon) return;

            if (volume === 0) {
                volumeIcon.src = "assets/volume-off.svg";
            } else if (volume >= 0.7) {
                volumeIcon.src = "assets/volume-high.svg";
            } else {
                volumeIcon.src = "assets/volume.svg";
            }
        });
    }

    // Play the next song when the current song ends
    currentSong.addEventListener("ended", () => {
        if (currentSong.loop) return;

        playNextSong();
    });

    // Repeat-one toggle
    if (repeatOne) {
        repeatOne.addEventListener("click", () => {
            isLoop = !isLoop;
            currentSong.loop = isLoop;

            repeatOne.src = isLoop
                ? "assets/repeat-active.svg"
                : "assets/repeat-one.svg";
        });
    }

    // Shuffle toggle
    if (shuffleBtn) {
        shuffleBtn.addEventListener("click", () => {
            isShuffle = !isShuffle;

            shuffleBtn.src = isShuffle
                ? "assets/shuffle-active.svg"
                : "assets/shuffle.svg";
        });
    }
}

// Play the next song
function playNextSong() {
    if (!songs.length) return;

    if (isShuffle && songs.length > 1) {
        let randomIndex;

        do {
            randomIndex = Math.floor(Math.random() * songs.length);
        } while (randomIndex === currentSongIndex);

        currentSongIndex = randomIndex;
    } else {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
    }

    playMusic(songs[currentSongIndex], false);
}

main();
