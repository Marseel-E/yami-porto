<script>
	import Navbar from "./Navbar.svelte";

	var id = 1;

	function decrease() { id -= 1; };
	function increase() { id += 1; };
</script>


<Navbar />
<div class="body">
	<div class="left">
		<div class="who">
			<h1>who am i?</h1>
			<p>my name is <span class="highlight colorful">omar emad</span> but you can call me <span class="highlight">yami</span>. I am <span class="highlight">18</span> years old, a <span class="highlight">discord bot developer</span> whose been coding for <span class="highlight">2</span> years. And also a first year college student.</p>
		</div>
	</div>
	<div class="right">
		<div class="what">
			<div class="top">
				<h1>what do i do?</h1>
				<p>i make <span class="highlight">custom discord bots</span> for server.<br>I will support the bot for a long-term for <span class="highlight">free</span>!</p>
				<div class="hosting">
					<h2>hosting</h2>
					<div class="indented">
						<h3>paid</h3>
						<p>the bot won't go <span class="highlight">offline</span>.</p>
						<h3>free</h3>
						<p>the bot will go <span class="highlight">offline</span> for a week at the end of each month.</p>
					</div>
				</div>
			</div>
			<div class="bottom">
				<h1>what can i do?</h1>
				<ul>
					<li>moderation system</li>
					<li>economy/currency system</li>
					<li>reaction role system</li>
					<li>welcome system</li>
					<li>leave system</li>
					<li>level up system</li>
					<li>ticket system</li>
					<li>modmail system</li>
					<li>invite manager system</li>
					<li>music system</li>
					<li>giveaway system</li>
					<li>custom systems/commands</li>
				</ul>
			</div>
		</div>
	</div>
</div>
<div class="reviews">
	<h1>reviews</h1>
	<div class="paginator">
		<button on:click={decrease}>&#8882</button>
		<img src="//unsplash.it/id/{id}/600/200" id="reviewImg" width="600" height="200" alt="review">
		<button on:click={increase}>&#8883</button>
	</div>
</div>


<style>
	.body {
		height: 100%;
		widows: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin: 2.5rem;
		background-color: transparent;
		gap: var(--gap, 2.5rem);
	}

	.left {
		padding: 1rem;
		border-radius: 2.5px;
		height: 100%;
		width: 30%;
	}

	.right {
		padding: 1rem;
		border-radius: 2.5px;
		height: 100%;
		width: 65%;
	}

	.indented {
		margin-left: 2rem;
		line-height: 0;
		gap: var(--gap, 1rem);
	}

	.bottom {
		margin-top: 2rem;
	}
	.bottom ul {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		grid-template-rows: repeat(3, 1fr);
		margin-right: 2rem;
		grid-gap: 1rem;
	}
	.bottom h1 { position: relative; }
	.bottom h1::after {
		content: "";
		background-color: var(--clr-main);
		height: 5px;
		width: 100%;
		position: absolute;
		top: -1rem;
		left: 0;
		border-radius: 5px;
	}
	.bottom ul > li {
		background-color: var(--clr-span);
		color: var(--clr-main);
		padding: .3rem;
		border-radius: 2.5px;
	}


	.reviews {
		padding: .5rem 1rem 1rem 1rem;
		text-align: center;
	}
	.reviews h1 {
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.paginator {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-evenly;
		gap: var(--gap, 1rem);
	}
	.paginator button {
		font-size: xx-large;
		font-weight: bold;
		color: var(--clr-h1);
		background-color: transparent;
		outline: none;
		border: none;
	}

	.colorful {
		background: -webkit-linear-gradient(45deg, red, purple);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		text-transform: capitalize;
		padding: 0 .5rem;
	}
	.highlight {
		font-weight: bold;
	}
</style>