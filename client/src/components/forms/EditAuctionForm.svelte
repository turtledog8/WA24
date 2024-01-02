<script>
    import { onMount } from 'svelte';

    export let id;

    let auction = null;
    let errorMessage = "";
    let tagsInputValue = ""; // Separate variable for the input field

    const fetchData = async () => {
        try {
            const response = await fetch(`http://localhost:3000/auctions/${id}`, {
                method: "GET"
            });

            if (response.ok) {
                auction = await response.json();
                // Initialize the input field value with the JSON string
                tagsInputValue = JSON.stringify(auction.tags);
            } else {
                console.error("Error fetching data:", response.status, response.statusText);
                errorMessage = "Failed to fetch auction data.";
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            errorMessage = "An unexpected error occurred.";
        }
    };

    onMount(() => {
        fetchData();
    });

    const submitEdit = async () => {
        const editedAuction = {
            item: auction.item,
            description: auction.description,
            images: auction.images,
            tags: JSON.parse(tagsInputValue) // Parse the JSON string back to an array
        };

        try {
            const response = await fetch(`http://localhost:3000/admin/edit-auction/${id}`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                    'token': localStorage.getItem('token')
                },
                body: JSON.stringify(editedAuction),
            });

            console.log("Response from server:", response);

            if (response.ok) {
                const updatedAuction = await response.json();
                console.log("Updated Auction:", updatedAuction.newAuction);
                // Update local auction data directly
                auction = updatedAuction.newAuction;
                // You might want to show a success message to the user
            } else {
                console.error("Error submitting edit:", response.status, response.statusText);
                const responseBody = await response.text();
                console.error("Response body:", responseBody);
                errorMessage = `Failed to submit edit. Server response: ${responseBody}`;
            }
        } catch (error) {
            console.error("Error submitting edit:", error);
            errorMessage = "An unexpected error occurred.";
        }
    };

</script>

<main>
    {#if auction !== null}
        <h1>Edit Auction - {auction.item}</h1>

        <label for="item">Item:</label>
        <input type="text" id="item" bind:value={auction.item} />

        <label for="description">Description:</label>
        <textarea id="description" bind:value={auction.description}></textarea>

        <label for="images">Images:</label>
        <input type="text" id="images" bind:value={auction.images} />

        <label for="tags">Tags:</label>
        <input type="text" id="tags" bind:value={tagsInputValue} />

        <div class="error-message">
            {#if errorMessage}
                {errorMessage}
            {/if}
        </div>

        <button on:click={submitEdit}>Submit Edit</button>
    {:else}
        <p>Loading...</p>
    {/if}
</main>

<style>
    /* Add your styling here */
    main {
        max-width: 600px;
        margin: 20px auto;
    }

    label {
        display: block;
        margin-bottom: 5px;
    }

    input,
    textarea {
        width: 100%;
        margin-bottom: 10px;
    }

    .error-message {
        color: red;
        margin-bottom: 10px;
    }

    button {
        padding: 10px;
        background-color:darkgreen;
        color: white;
        border: none;
        cursor: pointer;
    }
</style>
