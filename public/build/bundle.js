
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Navbar.svelte generated by Svelte v3.44.2 */

    const file$1 = "src\\Navbar.svelte";

    function create_fragment$1(ctx) {
    	let nav;
    	let ul;
    	let li0;
    	let a0;
    	let t1;
    	let li1;
    	let a1;
    	let t3;
    	let a2;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "discord server";
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "active alerts";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "request a bot";
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "svelte-f81f6k");
    			add_location(a0, file$1, 2, 23, 59);
    			attr_dev(li0, "class", "nav-item svelte-f81f6k");
    			add_location(li0, file$1, 2, 2, 38);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "class", "svelte-f81f6k");
    			add_location(a1, file$1, 3, 23, 119);
    			attr_dev(li1, "class", "nav-item svelte-f81f6k");
    			add_location(li1, file$1, 3, 2, 98);
    			attr_dev(ul, "class", "nav-container svelte-f81f6k");
    			add_location(ul, file$1, 1, 1, 8);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "invite svelte-f81f6k");
    			add_location(a2, file$1, 5, 1, 166);
    			attr_dev(nav, "class", "svelte-f81f6k");
    			add_location(nav, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(nav, t3);
    			append_dev(nav, a2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.2 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let navbar;
    	let t0;
    	let div8;
    	let div1;
    	let div0;
    	let h10;
    	let t2;
    	let p0;
    	let t3;
    	let span0;
    	let t5;
    	let span1;
    	let t7;
    	let span2;
    	let t9;
    	let span3;
    	let t11;
    	let span4;
    	let t13;
    	let t14;
    	let div7;
    	let div6;
    	let div4;
    	let h11;
    	let t16;
    	let p1;
    	let t17;
    	let span5;
    	let t19;
    	let br;
    	let t20;
    	let span6;
    	let t22;
    	let t23;
    	let div3;
    	let h2;
    	let t25;
    	let div2;
    	let h30;
    	let t27;
    	let p2;
    	let t28;
    	let span7;
    	let t30;
    	let t31;
    	let h31;
    	let t33;
    	let p3;
    	let t34;
    	let span8;
    	let t36;
    	let t37;
    	let div5;
    	let h12;
    	let t39;
    	let ul;
    	let li0;
    	let t41;
    	let li1;
    	let t43;
    	let li2;
    	let t45;
    	let li3;
    	let t47;
    	let li4;
    	let t49;
    	let li5;
    	let t51;
    	let li6;
    	let t53;
    	let li7;
    	let t55;
    	let li8;
    	let t57;
    	let li9;
    	let t59;
    	let li10;
    	let t61;
    	let li11;
    	let t63;
    	let div10;
    	let h13;
    	let t65;
    	let div9;
    	let button0;
    	let t67;
    	let img;
    	let img_src_value;
    	let t68;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;
    	navbar = new Navbar({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			div8 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "who am i?";
    			t2 = space();
    			p0 = element("p");
    			t3 = text("my name is ");
    			span0 = element("span");
    			span0.textContent = "omar emad";
    			t5 = text(" but you can call me ");
    			span1 = element("span");
    			span1.textContent = "yami";
    			t7 = text(". I am ");
    			span2 = element("span");
    			span2.textContent = "18";
    			t9 = text(" years old, a ");
    			span3 = element("span");
    			span3.textContent = "discord bot developer";
    			t11 = text(" whose been coding for ");
    			span4 = element("span");
    			span4.textContent = "2";
    			t13 = text(" years. And also a first year college student.");
    			t14 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div4 = element("div");
    			h11 = element("h1");
    			h11.textContent = "what do i do?";
    			t16 = space();
    			p1 = element("p");
    			t17 = text("i make ");
    			span5 = element("span");
    			span5.textContent = "custom discord bots";
    			t19 = text(" for server.");
    			br = element("br");
    			t20 = text("I will support the bot for a long-term for ");
    			span6 = element("span");
    			span6.textContent = "free";
    			t22 = text("!");
    			t23 = space();
    			div3 = element("div");
    			h2 = element("h2");
    			h2.textContent = "hosting";
    			t25 = space();
    			div2 = element("div");
    			h30 = element("h3");
    			h30.textContent = "paid";
    			t27 = space();
    			p2 = element("p");
    			t28 = text("the bot won't go ");
    			span7 = element("span");
    			span7.textContent = "offline";
    			t30 = text(".");
    			t31 = space();
    			h31 = element("h3");
    			h31.textContent = "free";
    			t33 = space();
    			p3 = element("p");
    			t34 = text("the bot will go ");
    			span8 = element("span");
    			span8.textContent = "offline";
    			t36 = text(" for a week at the end of each month.");
    			t37 = space();
    			div5 = element("div");
    			h12 = element("h1");
    			h12.textContent = "what can i do?";
    			t39 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "moderation system";
    			t41 = space();
    			li1 = element("li");
    			li1.textContent = "economy/currency system";
    			t43 = space();
    			li2 = element("li");
    			li2.textContent = "reaction role system";
    			t45 = space();
    			li3 = element("li");
    			li3.textContent = "welcome system";
    			t47 = space();
    			li4 = element("li");
    			li4.textContent = "leave system";
    			t49 = space();
    			li5 = element("li");
    			li5.textContent = "level up system";
    			t51 = space();
    			li6 = element("li");
    			li6.textContent = "ticket system";
    			t53 = space();
    			li7 = element("li");
    			li7.textContent = "modmail system";
    			t55 = space();
    			li8 = element("li");
    			li8.textContent = "invite manager system";
    			t57 = space();
    			li9 = element("li");
    			li9.textContent = "music system";
    			t59 = space();
    			li10 = element("li");
    			li10.textContent = "giveaway system";
    			t61 = space();
    			li11 = element("li");
    			li11.textContent = "custom systems/commands";
    			t63 = space();
    			div10 = element("div");
    			h13 = element("h1");
    			h13.textContent = "reviews";
    			t65 = space();
    			div9 = element("div");
    			button0 = element("button");
    			button0.textContent = "⊲";
    			t67 = space();
    			img = element("img");
    			t68 = space();
    			button1 = element("button");
    			button1.textContent = "⊳";
    			add_location(h10, file, 14, 3, 218);
    			attr_dev(span0, "class", "highlight colorful svelte-ymdl94");
    			add_location(span0, file, 15, 17, 254);
    			attr_dev(span1, "class", "highlight svelte-ymdl94");
    			add_location(span1, file, 15, 87, 324);
    			attr_dev(span2, "class", "highlight svelte-ymdl94");
    			add_location(span2, file, 15, 129, 366);
    			attr_dev(span3, "class", "highlight svelte-ymdl94");
    			add_location(span3, file, 15, 176, 413);
    			attr_dev(span4, "class", "highlight svelte-ymdl94");
    			add_location(span4, file, 15, 251, 488);
    			add_location(p0, file, 15, 3, 240);
    			attr_dev(div0, "class", "who");
    			add_location(div0, file, 13, 2, 197);
    			attr_dev(div1, "class", "left svelte-ymdl94");
    			add_location(div1, file, 12, 1, 176);
    			add_location(h11, file, 21, 4, 655);
    			attr_dev(span5, "class", "highlight svelte-ymdl94");
    			add_location(span5, file, 22, 14, 692);
    			add_location(br, file, 22, 76, 754);
    			attr_dev(span6, "class", "highlight svelte-ymdl94");
    			add_location(span6, file, 22, 123, 801);
    			add_location(p1, file, 22, 4, 682);
    			add_location(h2, file, 24, 5, 873);
    			add_location(h30, file, 26, 6, 924);
    			attr_dev(span7, "class", "highlight svelte-ymdl94");
    			add_location(span7, file, 27, 26, 964);
    			add_location(p2, file, 27, 6, 944);
    			add_location(h31, file, 28, 6, 1014);
    			attr_dev(span8, "class", "highlight svelte-ymdl94");
    			add_location(span8, file, 29, 25, 1053);
    			add_location(p3, file, 29, 6, 1034);
    			attr_dev(div2, "class", "indented svelte-ymdl94");
    			add_location(div2, file, 25, 5, 895);
    			attr_dev(div3, "class", "hosting");
    			add_location(div3, file, 23, 4, 846);
    			attr_dev(div4, "class", "top");
    			add_location(div4, file, 20, 3, 633);
    			attr_dev(h12, "class", "svelte-ymdl94");
    			add_location(h12, file, 34, 4, 1194);
    			attr_dev(li0, "class", "svelte-ymdl94");
    			add_location(li0, file, 36, 5, 1232);
    			attr_dev(li1, "class", "svelte-ymdl94");
    			add_location(li1, file, 37, 5, 1264);
    			attr_dev(li2, "class", "svelte-ymdl94");
    			add_location(li2, file, 38, 5, 1302);
    			attr_dev(li3, "class", "svelte-ymdl94");
    			add_location(li3, file, 39, 5, 1337);
    			attr_dev(li4, "class", "svelte-ymdl94");
    			add_location(li4, file, 40, 5, 1366);
    			attr_dev(li5, "class", "svelte-ymdl94");
    			add_location(li5, file, 41, 5, 1393);
    			attr_dev(li6, "class", "svelte-ymdl94");
    			add_location(li6, file, 42, 5, 1423);
    			attr_dev(li7, "class", "svelte-ymdl94");
    			add_location(li7, file, 43, 5, 1451);
    			attr_dev(li8, "class", "svelte-ymdl94");
    			add_location(li8, file, 44, 5, 1480);
    			attr_dev(li9, "class", "svelte-ymdl94");
    			add_location(li9, file, 45, 5, 1516);
    			attr_dev(li10, "class", "svelte-ymdl94");
    			add_location(li10, file, 46, 5, 1543);
    			attr_dev(li11, "class", "svelte-ymdl94");
    			add_location(li11, file, 47, 5, 1573);
    			attr_dev(ul, "class", "svelte-ymdl94");
    			add_location(ul, file, 35, 4, 1222);
    			attr_dev(div5, "class", "bottom svelte-ymdl94");
    			add_location(div5, file, 33, 3, 1169);
    			attr_dev(div6, "class", "what");
    			add_location(div6, file, 19, 2, 611);
    			attr_dev(div7, "class", "right svelte-ymdl94");
    			add_location(div7, file, 18, 1, 589);
    			attr_dev(div8, "class", "body svelte-ymdl94");
    			add_location(div8, file, 11, 0, 156);
    			attr_dev(h13, "class", "svelte-ymdl94");
    			add_location(h13, file, 54, 1, 1673);
    			attr_dev(button0, "class", "svelte-ymdl94");
    			add_location(button0, file, 56, 2, 1717);
    			if (!src_url_equal(img.src, img_src_value = "//unsplash.it/id/" + /*id*/ ctx[0] + "/600/200")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "id", "reviewImg");
    			attr_dev(img, "width", "600");
    			attr_dev(img, "height", "200");
    			attr_dev(img, "alt", "review");
    			add_location(img, file, 57, 2, 1763);
    			attr_dev(button1, "class", "svelte-ymdl94");
    			add_location(button1, file, 58, 2, 1860);
    			attr_dev(div9, "class", "paginator svelte-ymdl94");
    			add_location(div9, file, 55, 1, 1691);
    			attr_dev(div10, "class", "reviews svelte-ymdl94");
    			add_location(div10, file, 53, 0, 1650);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h10);
    			append_dev(div0, t2);
    			append_dev(div0, p0);
    			append_dev(p0, t3);
    			append_dev(p0, span0);
    			append_dev(p0, t5);
    			append_dev(p0, span1);
    			append_dev(p0, t7);
    			append_dev(p0, span2);
    			append_dev(p0, t9);
    			append_dev(p0, span3);
    			append_dev(p0, t11);
    			append_dev(p0, span4);
    			append_dev(p0, t13);
    			append_dev(div8, t14);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, h11);
    			append_dev(div4, t16);
    			append_dev(div4, p1);
    			append_dev(p1, t17);
    			append_dev(p1, span5);
    			append_dev(p1, t19);
    			append_dev(p1, br);
    			append_dev(p1, t20);
    			append_dev(p1, span6);
    			append_dev(p1, t22);
    			append_dev(div4, t23);
    			append_dev(div4, div3);
    			append_dev(div3, h2);
    			append_dev(div3, t25);
    			append_dev(div3, div2);
    			append_dev(div2, h30);
    			append_dev(div2, t27);
    			append_dev(div2, p2);
    			append_dev(p2, t28);
    			append_dev(p2, span7);
    			append_dev(p2, t30);
    			append_dev(div2, t31);
    			append_dev(div2, h31);
    			append_dev(div2, t33);
    			append_dev(div2, p3);
    			append_dev(p3, t34);
    			append_dev(p3, span8);
    			append_dev(p3, t36);
    			append_dev(div6, t37);
    			append_dev(div6, div5);
    			append_dev(div5, h12);
    			append_dev(div5, t39);
    			append_dev(div5, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t41);
    			append_dev(ul, li1);
    			append_dev(ul, t43);
    			append_dev(ul, li2);
    			append_dev(ul, t45);
    			append_dev(ul, li3);
    			append_dev(ul, t47);
    			append_dev(ul, li4);
    			append_dev(ul, t49);
    			append_dev(ul, li5);
    			append_dev(ul, t51);
    			append_dev(ul, li6);
    			append_dev(ul, t53);
    			append_dev(ul, li7);
    			append_dev(ul, t55);
    			append_dev(ul, li8);
    			append_dev(ul, t57);
    			append_dev(ul, li9);
    			append_dev(ul, t59);
    			append_dev(ul, li10);
    			append_dev(ul, t61);
    			append_dev(ul, li11);
    			insert_dev(target, t63, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, h13);
    			append_dev(div10, t65);
    			append_dev(div10, div9);
    			append_dev(div9, button0);
    			append_dev(div9, t67);
    			append_dev(div9, img);
    			append_dev(div9, t68);
    			append_dev(div9, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*decrease*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*increase*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*id*/ 1 && !src_url_equal(img.src, img_src_value = "//unsplash.it/id/" + /*id*/ ctx[0] + "/600/200")) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div8);
    			if (detaching) detach_dev(t63);
    			if (detaching) detach_dev(div10);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	var id = 1;

    	function decrease() {
    		$$invalidate(0, id -= 1);
    	}

    	function increase() {
    		$$invalidate(0, id += 1);
    	}
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Navbar, id, decrease, increase });

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, decrease, increase];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
