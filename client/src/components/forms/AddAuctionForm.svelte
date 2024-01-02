<script>
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import { navigate } from 'svelte-routing';

    const dispatch = createEventDispatcher();

    let auction = {
        item: '',
        description: '',
        tags: [
            { name: 'Time', value: '' },
            { name: 'Type', value: '' },
            { name: 'Size', value: '' }
        ],
        bonusTags: [],
        images: [],
        closingTime: '24'
    };

    let isAdmin = false;

    const handleSubmit = async () => {
        // Log the auction object before sending to the server
        console.log('Auction before submission:', auction);

        // Convert tags to an array of strings
        const tagsArray = auction.tags.map(tag => `${tag.name}: ${tag.value}`);
        const bonusTagsArray = auction.bonusTags.map(tag => `${tag.name}: ${tag.value}`);

        // Send the auction data to the server
        const response = await fetch('http://localhost:3000/admin/add-auction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': localStorage.getItem('token')
            },
            body: JSON.stringify({
                ...auction,
                tags: tagsArray,
                bonusTags: bonusTagsArray,
                closingTime: 24
            })
        });

        if (response.ok) {
            console.log('Auction added successfully');
            // Redirect to the /store route
            // window.location.href = "/store";
        } else {
            console.error('Failed to add auction:', response.status, response.statusText);
            const errorResponse = await response.json();
            console.error('Error details:', errorResponse);
        }
    };

    onMount(() => {
        // Check if the user is an admin
        const token = localStorage.getItem('token');
        const decodedToken = decodeJWT(token);
        isAdmin = decodedToken && decodedToken.isAdmin;
    });

    function decodeJWT(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace('-', '+').replace('_', '/');
        const payload = JSON.parse(atob(base64));
        return payload;
    }

    const addTag = () => {
        // Check if the last tag has non-empty values, then add a new tag
        const lastTag = auction.bonusTags[auction.bonusTags.length - 1];
        if (!lastTag || (lastTag.name !== '' || lastTag.value !== '')) {
            // Add a new tag as a bonus tag
            auction.bonusTags = [...auction.bonusTags, { name: '', value: '' }];
        }
        console.log('Auction after adding tag:', auction);
    };

    const removeTag = (index, isBonusTag) => {
        // Ensure that the required tags (Time, Type, Size) cannot be removed
        if (!isBonusTag && index >= 0 && index < 3) {
            console.log('Cannot remove required tags.');
            return;
        }

        // Remove the tag
        if (isBonusTag) {
            auction.bonusTags.splice(index, 1);
        } else {
            auction.tags.splice(index, 1);
        }

        console.log('Auction after removing tag:', auction);
    };

    // Prevent default form submission when clicking "Add Tag" or "Remove Tag"
    const preventDefault = (event) => {
        event.preventDefault();
    };
</script>

<style>
    /* Add your styles here */
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

    .tag-container {
        display: flex;
        align-items: baseline;
    }

    .tag-input {
        margin-right: 10px;
    }

    button {
        padding: 10px;
        background-color: darkgreen;
        color: white;
        border: none;
        cursor: pointer;
    }
</style>

<main>
    {#if isAdmin}
        <h1>Add Auction</h1>

        <form on:submit|preventDefault={handleSubmit}>
            <label for="item">Item:</label>
            <input type="text" id="item" bind:value={auction.item} required />

            <label for="description">Description:</label>
            <textarea id="description" bind:value={auction.description} required></textarea>

            {#each auction.tags as { name, value }, index}
                <div class="tag-container">
                    <label for={`tags-${index}-name`}>Tag:</label>
                    <input type="text" bind:value={name} id={`tags-${index}-name`} class="tag-input" />
                    <label for={`tags-${index}-value`}>Value:</label>
                    <input type="text" bind:value={value} id={`tags-${index}-value`} class="tag-input" />
                </div>
            {/each}


            {#each auction.bonusTags as { name, value }, index}
                <div class="tag-container">
                    <label for={`bonusTags-${index}-name`}>Tag:</label>
                    <input type="text" bind:value={name} id={`bonusTags-${index}-name`} class="tag-input" />
                    <label for={`bonusTags-${index}-value`}>Value:</label>
                    <input type="text" bind:value={value} id={`bonusTags-${index}-value`} class="tag-input" />
                    <button on:click|preventDefault={() => removeTag(index, true)}>Remove Tag</button>
                </div>
            {/each}

            <button on:click|preventDefault={addTag}>Add Tag</button>

            <label for="images">Images (comma-separated URLs):</label>
            <input type="text" id="images" bind:value={auction.images} />

            <button type="submit">Add Auction</button>
        </form>
    {:else}
        <p>You do not have permission to add auctions.</p>
    {/if}
</main>
