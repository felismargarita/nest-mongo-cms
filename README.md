## Description

This a nest js module that could help you build a CMS system rapidly. Once you import this module, your nest project will get a set of standard restful APIs to do CRUD, besides, you could inject your own logic to these APIs(even build a new API) through the built-in hooks.
## Prerequisites

This module is restricted to be used when your nestjs project is using [nest mongoose module](https://docs.nestjs.com/techniques/mongodb).

## Why this module

While there are already many CMS systems in the community, including many so-called "headless" CMS platforms that aim to provide out-of-the-box solutions, they remain third-party systems that require integration. Though user-friendly and seemingly extensible, this integration process often undermines their "out-of-the-box" appeal, making them feel cumbersome.

If you're developing a system with NestJS and Mongoose and need CMS-like capabilities, this module is tailor-made for you. Simply import it, and core CMS functionalities will seamlessly integrate into your existing system—no mental overhead required. If the module doesn’t fully meet your needs, leverage its built-in hooks for deep customization.

In short, this module focuses solely on delivering capabilities without locking you into any specific conventions.

## Installation

It's still in beta stage, not published yet, if you are intersted on it, please contact me or issue a ticket directly.

## Configure the module

| Item | Value | Description |
|-------|------|-------|
| path | string | prefix of cms api |
| connectionName | string | mongoose connectionName |
|schemas|Object|schema configuration|
|plugins|Object|activate your own plugin|

## Hooks
* afterQuery
* beforeCreate
* afterCreate
* beforeUpdate
* afterUpdate
* beforeDelete
* afterDelete
* afterError
* catchException
* operation

## Plugins

For those advanced features, it's highly recommmended to build via plugin, for now, 2 plugins are in building.

[Version Control Plugin]() is made for version control, once you import this plugin, your content modification will be automatically tracked.

[Content Review Plugin]() is made for building a review / approve workflow for you, once you import this plugin, all of the cms content modification needs the review / approve, which could help you improve the content safty.
## Support

[Mail to me](mailto:felismargarita@hotmail.com)


## License

MIT
