addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})
//Fields for each page using 0 or 1 for the page varient.
const dataModifiers = [
    {
        "title": "Adam's Website",
        "h1": "Howdy friend!",
        "p": "Check out Adam's website!",
        "href": "https://www.adamfrederiksen.com",
        "a": "See my website!",
        "d": "M12.02 0c6.614.011 11.98 5.383 11.98 12 0 6.623-5.376 12-12 12-6.623 0-12-5.377-12-12 0-6.617 5.367-11.989 11.981-12h.039zm3.694 16h-7.427c.639 4.266 2.242 7 3.713 7 1.472 0 3.075-2.734 3.714-7m6.535 0h-5.523c-.426 2.985-1.321 5.402-2.485 6.771 3.669-.76 6.671-3.35 8.008-6.771m-14.974 0h-5.524c1.338 3.421 4.34 6.011 8.009 6.771-1.164-1.369-2.059-3.786-2.485-6.771m-.123-7h-5.736c-.331 1.166-.741 3.389 0 6h5.736c-.188-1.814-.215-3.925 0-6m8.691 0h-7.685c-.195 1.8-.225 3.927 0 6h7.685c.196-1.811.224-3.93 0-6m6.742 0h-5.736c.062.592.308 3.019 0 6h5.736c.741-2.612.331-4.835 0-6m-12.825-7.771c-3.669.76-6.671 3.35-8.009 6.771h5.524c.426-2.985 1.321-5.403 2.485-6.771m5.954 6.771c-.639-4.266-2.242-7-3.714-7-1.471 0-3.074 2.734-3.713 7h7.427zm-1.473-6.771c1.164 1.368 2.059 3.786 2.485 6.771h5.523c-1.337-3.421-4.339-6.011-8.008-6.771",
        "svgclassoverride": "h-6 w-6 text-red-600",
        "svgviewboxoverride": "-3 -3 30 30",
        "buttonclassoveride": "inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 bg-red-600 text-base leading-6 font-medium text-white shadow-sm hover:bg-orange-500 focus:outline-none focus:border-red-700 focus:shadow-outline-indigo transition ease-in-out duration-150 sm:text-sm sm:leading-5"
  },
    {
        "title": "Adam's LinkedIn",
        "h1": "Hi there!",
        "p": "Connect with Adam on LinkedIn!",
        "href": "https://www.linkedin.com/in/adam-frederiksen/",
        "a": "Connect with me!",
        "d": "M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z",
        "svgclassoverride": "h-6 w-6 text-blue-600",
        "svgviewboxoverride": "-3 0 30 30",
        "buttonclassoveride": "inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 bg-blue-600 text-base leading-6 font-medium text-white shadow-sm hover:bg-teal-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-indigo transition ease-in-out duration-150 sm:text-sm sm:leading-5"
  }
]
//handle request checks for cookie values -- sets varient to them if cookies present -- if not, cookies are set.
async function handleRequest(request) {
    try {
        let variantIndex = null
        let isCookieSet = false
        const cookieVariant = request.headers.get("Cookie")
        if (cookieVariant && cookieVariant.includes("variant=0")) {
            variantIndex = 0
            isCookieSet = true
        } else if (cookieVariant && cookieVariant.includes("variant=1")) {
            variantIndex = 1
            isCookieSet = true
        } else {
            variantIndex = Math.round(Math.random());
        }
        //Constant variables which require awaits
        const pageVariants = await fetchCloudflareVariants()
        const pageURL = pageVariants[variantIndex]
        const htmlPage = await getVariantPage(pageURL)
        const response = new Response(htmlPage)
        response.headers.set('Content-Type', "text/html")
        //Set cookies if they aren't present (randomly set above)
        if (!isCookieSet) {
            response.headers.set("Set-Cookie", "variant=" + variantIndex + "; SameSite=Lax; HttpOnly;")
        }
        //Return HTMLRewrite | https://developers.cloudflare.com/workers/reference/apis/html-rewriter/
        return new HTMLRewriter()
            .on('title', new rewriteTag(dataModifiers[variantIndex]["title"]))
            .on('h1', new rewriteTag(dataModifiers[variantIndex]["h1"]))
            .on('p', new rewriteTag(dataModifiers[variantIndex]["p"]))
            .on('a', new rewriteTag(dataModifiers[variantIndex]["a"]))
            .on('a', new rewriteAtrribute('href', dataModifiers[variantIndex]["href"]))
            .on('a', new rewriteAtrribute('class', dataModifiers[variantIndex]["buttonclassoveride"]))
            .on('path', new rewriteAtrribute('d', dataModifiers[variantIndex]["d"]))
            .on('svg', new rewriteAtrribute('class', dataModifiers[variantIndex]["svgclassoverride"]))
            .on('svg', new rewriteAtrribute('viewBox', dataModifiers[variantIndex]["svgviewboxoverride"]))
            .transform(response)
    } catch (err) {
        // Return the error stack as the response
        return new Response(err.stack || err)
    }
}
//Rewrites the attributes on the tag | https://developers.cloudflare.com/workers/reference/apis/html-rewriter/
class rewriteAtrribute {
    constructor(attributeName, atributeValue) {
        this.attributeName = attributeName
        this.atributeValue = atributeValue
    }
    element(element) {
        element.setAttribute(this.attributeName, this.atributeValue)
    }
}
//Rewrites the text on the tag | https://developers.cloudflare.com/workers/reference/apis/html-rewriter/
class rewriteTag {
    constructor(contentValue) {
        this.contentValue = contentValue
    }
    element(element) {
        element.setInnerContent(this.contentValue)
    }
}
//Fetches JSON from the Cloudflare Worker api | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
async function fetchCloudflareVariants() {
    const variants = await fetch("https://cfw-takehome.developers.workers.dev/api/variants")
        .then(response => response.json())
        .then(data => {
            return data["variants"]
        })
    return variants
}
//Takes in page varient and returns the code of the page | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
async function getVariantPage(pageVariant) {
    const page = await fetch(pageVariant)
        .then(response => {
            return response.body
        })
    return page
}
