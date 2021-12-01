<nav>
	<ul class="nav-container">
		<li class="nav-item"><a href="/">discord server</a></li>
		<li class="nav-item"><a href="/">active alerts</a></li>		
	</ul>
	<a href="#" class="invite">request a bot</a>
</nav>


<style>
	nav {
		background-color: var(--clr-div);
		color: var(--clr-h1);
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: .5rem 1rem;
	}
	.nav-container {
		padding: 0;
		display: flex;
		gap: var(--gap, 1rem);
		list-style-type: none;
	}
	.nav-item a {
		text-decoration: none;
		font-weight: bold;
		text-transform: uppercase;
		color: var(--clr-h1);
	}
	.invite {
		padding: .5rem;
		background-color: var(--clr-p);
		color: var(--clr-div);
		text-decoration: none;
		text-transform: capitalize;
		font-weight: bold;
		border-radius: 2.5px;
	}
</style>