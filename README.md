# pot
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

A CLI to instantly get an overview of one or more repos' PRs, and decide which PR to act upon next.

![Version badge](https://img.shields.io/badge/version-1.1.1-green.svg)

`pot` stands for Pr Overview Tool

Note: This is an ongoing project, and issues are frequently opened and closed. Refactorings and improvements are on the way. Check the [issues section](https://github.com/ioanniswd/pot/issues) for more info.

# How it works

`pot` creates accumulated data for users concerning one or more repositories, using
github's graphql api.

# Installation

```sh
$ git clone https://github.com/ioanniswd/pot
$ cd pot
$ ./install.sh # Installed as a gem
```

# Usage

Note: Since github needs a personal access token, this token must be accessible
to `pot`, like so for example:

```sh
$ GAT=<your_token> pot <options, etc>
```

Or better yet:

```sh
$ GAT=`cat pat/to/token/file` pot <options, etc>
```

(GAT -> Github Access Token)

In the usage examples following, `GAT` assignment will not be prefixed for
simplicity.


## Multiple user overview

```sh
$ pot --users=john,jane,doe

+------+----------+-----------+-------+---------------+-------------+-------------------+-----------+
| User | Authored | Reviewing | Total |  Total + / -  | Actionables | Actionable  + / - | Untouched |
+------+----------+-----------+-------+---------------+-------------+-------------------+-----------+
| doe  | 3        | 0         | 3     | 146 / 82      | 1           | 40 / 37           | 0         |
| jane | 1        | 2         | 3     | 270 / 254     | 2           | 200 / 187         | 0         |
| john | 2        | 1         | 3     | 34 / 48       | 3           | 34 / 48           | 0         |
+------+----------+-----------+-------+---------------+-------------+-------------------+-----------+
```

Note: By default, `pot` only counts open PRs.

#### Authored
Number of PRs authored by the user

#### Reviewing
Number of PRs currently reviewing, meaning that said user has not
approved, or rejected the PR. If user is a requested reviewer, or if user has
placed comments but has not approved or rejected the PR yet, they are considered
**active reviewers**, and said PR counts as one they are currently reviewing.

#### Total
Authored + Reviewing

#### Total + / -
Additions/Deletions for all active PRs of user

#### Actionables
A PR is considered actionable for a user, when said user can
perform any action in said PR, and is probably blocking another user. For
example, if `john` is the author of a PR, and `jane` places some comments, that PR
becomes actionable for `john`, and non actionable for `jane`. When `john` responds to
`jane's` comments and re-requests review from her, PR becomes non actionable for
`john` and actionable for `jane`.

#### Actionable + / -
Additions/Deletions for all actionable PRs of user

#### Untouched
When a user is requested to review a PR, and until the moment
they place their first comment, that PR is considered untouched for said user.
This is useful when workload ends up unevenly distributed amongst devs, and a
dev who has an easier time, tries to decide whose PR they are going to review to
even the load.

### Note:
The above rows are sorted. First by **Total**, then by **Actionable**, and finally by **Untouched** (asc). This way, the most likely candidate to whom a new PR will be assigned, will be closer to the top, and the most likely candidate who might need some help with their PRs, will be closer to the bottom.

## Details about a specific user's PRs

The above example only shows the accumulated counts for each user. Usually, one
will want more details about a specific user's PRs. In that case the
`--user=<user>` option can be used.

```sh
$ pot --user=doe

+------+----------+-----------+-------+---------------+-------------+-------------------+-----------+
| User | Authored | Reviewing | Total |  Total + / -  | Actionables | Actionable  + / - | Untouched |
+------+----------+-----------+-------+---------------+-------------+-------------------+-----------+
| doe  | 2        | 3         | 5     | 5287 / 2095   | 3           | 5270 / 2035       | 1         |
| john | 3        | 2         | 5     | 5287 / 2095   | 1           | 5270 / 2035       | 1         |
+------+----------+-----------+-------+---------------+-------------+-------------------+-----------+

+------------+-----------+-------------+---------------------------+
|                         Authored                                 |
+------------+-----------+-------------+---------------------------+
| Actionable | Approvals | +/-         | PR                        |
+------------+-----------+-------------+---------------------------+
| Yes        | 2 / 2     | 4729 / 1561 | Add feature cool (PR_url) |
| No         | 1 / 3     | 12 / 58     | Fix bug wah(PR_url)       |
+------------+-----------+-------------+---------------------------+

+------------+-----------+---------------------+-----------+-----------+--------------------------+
|                                      Reviewing                                                  |
+------------+-----------+---------------------+-----------+-----------+--------------------------+
| Actionable | Untouched | Author: Actionables | Approvals | +/-       | PR                       |
+------------+-----------+---------------------+-----------+-----------+--------------------------+
| Yes        | Yes       | john: 1             | 1 / 2     | 304 / 39  | Add feature wow (PR_url) |
| Yes        | No        | john: 1             | 0 / 2     | 237 / 435 | Fix bug dang (PR_url)    |
| No         | No        | jane: 1             | 3 / 3     | 5 / 2     | Improve styles (PR_url)  |
+------------+-----------+---------------------+-----------+-----------+--------------------------+
```

Note: Both `--users=<user, names>` and `--user='user'` can be used:
```sh
$ pot --users=john,jane --user=doe
```
And both the accumulative and the specific output will be shown

In the above example, the accumulative data is shown for user `doe`, as well
as some details about each of the PRs they are involved in. This can be used by
`doe` to figure out which PR needs their attention first, or by another user
who happened to have some idle time and wants to help out. Information about
`john` appear as well, since john is the author of all the PRs that `doe` is
reviewing, and is also reviewing all PRs that `doe` has authored. This allows
one to simply pass the `--user` argument and get information on the status of all
users with which they share any PRs, without explicitly passing a `--users`
argument.

#### Approvals
The ratio of users who have approved the PR, to all users ever involved in the PR.

#### +/-
Additions / Deletions in lines of code

## List all of user's PR urls

This is used to conveniently open all of a users PRs in the browser

```sh
$ pot --user=doe --url-only

```

This way one can open all of `doe's` PRs in a browser like this:
```sh
$ pot --user=doe --url-only | xargs -L1 xdg-open
```


# Configuration
```sh
$ pot --config
```
Follow the wizard to define the github url, repository and owner names.
You can provide all said config options as params, like so:

```sh
$ pot --user=doe --repository_names "octo, cat" --owner_name 'repo_owner_name' --github_url 'github.<company_name>.com'

```

# Register
In case command is usually being used with certain options, options can be saved
under a certain name like so:

```sh
$ pot --users=jane,jack --user=doe --repository_names "octo, cat" --register_new <register_name>
```
And then:

```sh
$ pot --registered <register_name>
```

In the above example, options `users`, `user` etc are being filled through the
saved registry in the config.

You can also override some of the underlying options saved in the registry:
```sh
$ pot --registered <register_name> --repository_names 'some, other, repos'
```

# Speeding up
There is the option of caching raw data returned from github for future use,
which significantly speeds up further responses. For example, running:

```sh
$ pot --users=john,jane,doe
```

And then, wanting to know more about a specific user through the detailed view:

```sh
$ pot --user=doe --cached
```

This way, for the second command, no request is made, the data is considered to
be the same.

To enable this feature, run the config wizard. If enabled, the raw data from
the request(s) are stored in `pot_root_folder/cached_response` everytime the command
sends a request to github. Results are cached under the repo names used
in the command. If different repo names are used, the request is made and its
response is **also** saved in the aforementioned file.

e.g.

Assume the cache was just enabled (`cache_enabled: true` in the config file).

Note: The `--cached` option specifies that we want to use the cached response, if
present. If not present, the request is made as if `--cached` was ommited.

This **sends** the request and saves the raw response:

```sh
$ pot --users=jane,doe --repository_names=octo --cached
```

This **also sends** the request and saves the raw response under a different key:

```sh
$ pot --users=jane,doe --repository_names=octo,cat --cached
```

Subsequent requests made with the repositories being `octo`, `octo,cat` or `cat, octo` and the `--cached` option will use the cached response from the previous requests.
For example, the following commands will **not** trigger a request:

```sh
$ pot --users=john --repository_names=octo,cat --cached
```
```sh
$ pot --users=jane --repository_names=cat,octo --cached
```
```sh
$ pot --users=doe --repository_names=octo --cached
```

But this one will, since response for repo `cat` alone has not been received so
far:
```sh
$ pot --users=doe --repository_names=cat --cached
```

Note: `--cached` is not saved when using `--register` [See `register`](#register)


# Contributing

1. Create an issue describing the purpose of the pull request unless there is one already
2. Fork the repository ( https://github.com/ioanniswd/pot/fork )
3. Create your feature branch (`git checkout -b my-new-feature`)
4. Commit your changes (`git commit -am 'Add some feature'`)
5. Push to the branch (`git push origin my-new-feature`)
6. Create a new Pull Request


## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://iridakos.com"><img src="https://avatars3.githubusercontent.com/u/9477868?v=4" width="100px;" alt=""/><br /><sub><b>Lazarus Lazaridis</b></sub></a><br /><a href="#ideas-iridakos" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/sntokos"><img src="https://avatars2.githubusercontent.com/u/56229533?v=4" width="100px;" alt=""/><br /><sub><b>Stefanos Ntokos</b></sub></a><br /><a href="#ideas-sntokos" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!


# License

This tool is open source under the [MIT License](https://opensource.org/licenses/MIT) terms.

[[Back To Top]](#pot)
