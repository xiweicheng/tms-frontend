class SearchItems {
    max;
    items = [];

    constructor(max = 10) {
        this.max = max;
    }

    put(...items) {
        for (var item of items) {
            this.items = _.reject(this.items, { id: item.id });
            if (this.items.length < this.max) {
                this.items.push(item);
            } else {
                this.items = _.tail(this.items);
                this.items.push(item);
            }
        }
    }

    size() {
        return this.items.length;
    }

    list() {
        return this.items;
    }

}

class Search {
    blogs;
    comments;

    constructor() {
        this.blogs = new SearchItems(3);
        this.comments = new SearchItems();
        let s = this._load();
        this.blogs.put(...s.blogs);
        this.comments.put(...s.comments);
    }

    add(item) {
        if (item.type == 'blog') {
            this._addBlog(item);
        } else {
            this._addComment(item);
        }
        this._save();
    }

    _addBlog(blog) {
        this.blogs.put(blog);
    }

    _addComment(comment) {
        this.comments.put(comment);
    }

    _save() {
        localStorage && localStorage.setItem(nsCons.KEY_BLOG_SEARCH_RECENT, JSON.stringify({
            blogs: this.blogs.list(),
            comments: this.comments.list()
        }));
    }

    _load() {

        if (localStorage) {
            let s = localStorage.getItem(nsCons.KEY_BLOG_SEARCH_RECENT);
            if (s) {
                return JSON.parse(s);
            }
        }

        return {
            blogs: [],
            comments: []
        }

    }
}

export default new Search();
