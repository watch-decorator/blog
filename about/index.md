---
layout: layouts/base.njk
title: About
templateClass: tmpl-post
eleventyNavigation:
  key: About
  order: 3
---


## This Blog 

Just some random stuff.

## Kernel Panic

From [Wikipedia](https://en.wikipedia.org/wiki/Kernel_panic):
> A kernel panic is a safety measure taken by an operating system's kernel upon detecting an internal fatal error in which either it is unable to safely recover or continuing to run the system would have a higher risk of major data loss. 


## Site Generator & Template

This blog site is based on the template [eleventy-high-performance-blog](https://github.com/google/eleventy-high-performance-blog), which itself is based on [eleventy-base-blog](https://github.com/11ty/eleventy-base-blog).

<share-widget>
  <button on-click="share" aria-label="Share" href="{{ metadata.url | safe }}">
    <div></div>
  </button>
</share-widget>