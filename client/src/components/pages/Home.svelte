<script>
    import { onMount, onDestroy } from "svelte";
    import { slide } from 'svelte/transition'; // Import the slide transition

    let featuredAuctions = [];
    let currentImageIndex = 0;
    let isTransitioning = false;
    let auctionDiv; // Reference to the div element

    onMount(async () => {
        try {
            const response = await fetch("http://localhost:3000/auctions", {
                method: "GET"
            });
            if (response.ok) {
                featuredAuctions = await response.json();
                console.log("Fetched Auctions:", featuredAuctions);

                // Start the automatic image switch interval
                startImageSwitch();
            } else {
                console.error("Failed to fetch data");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    });

    // Function to show the next image
    const showNextImage = () => {
        if (!isTransitioning) {
            isTransitioning = true;
            currentImageIndex = (currentImageIndex + 1) % featuredAuctions.length;

            // Reset isTransitioning after the transition duration
            setTimeout(() => {
                isTransitioning = false;
            }, 500); // Adjust the duration based on your transition time
        }
    };

    // Function to show the previous image
    const showPreviousImage = () => {
        if (!isTransitioning) {
            isTransitioning = true;
            currentImageIndex = (currentImageIndex - 1 + featuredAuctions.length) % featuredAuctions.length;

            // Reset isTransitioning after the transition duration
            setTimeout(() => {
                isTransitioning = false;
            }, 500); // Adjust the duration based on your transition time
        }
    };

    // Function to start the automatic image switch interval
    const startImageSwitch = () => {
        // Set interval to switch image every 5 seconds
        const intervalId = setInterval(() => {
            showNextImage();
        }, 5000);

        // Clean up the interval on component destroy
        onDestroy(() => {
            clearInterval(intervalId);
        });
    };
</script>

<main>
    <section>
        <h1>Welcome to the Auction House!</h1>
        <p>Discover unique items and place your bids in exciting auctions.</p>
    </section>

    <section>
        <h2>Featured Auctions</h2>
        {#if featuredAuctions.length > 0}
            <div class="auction" bind:this={auctionDiv}>
                {#key currentImageIndex}
                    <img src={featuredAuctions[currentImageIndex].images[0]} transition:slide/>
                {/key}
            </div>
            <div class="navigation">
                <button on:click={showPreviousImage}>Previous</button>
                <button on:click={showNextImage}>Next</button>
            </div>
        {:else}
            <p>No featured auctions available.</p>
        {/if}
    </section>
</main>

<style>
    main {
        max-width: 800px;
        margin: auto;
        padding: 20px;
    }

    section {
        margin-bottom: 20px;
    }

    h1, h2, h3 {
        color: white;
    }

    .auction {
        border: 1px solid #ddd;
        margin-bottom: 20px;
        position: relative;
        overflow: hidden;
        transition: transform 0.5s ease-in-out; /* Add slide transition effect */
    }

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover; /* Zoom the image to cover the container without stretching */
        aspect-ratio: 16/9;
    }

    .navigation {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
    }

    button {
        background-color: #4CAF50;
        color: white;
        border: none;
        padding: 10px 20px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        cursor: pointer;
    }
</style>
