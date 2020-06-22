# pot

A CLI to instantly get an overview of one or more repos' PRs, and decide which PR to act upon next.

![Version badge](https://img.shields.io/badge/version-1.0.0-green.svg)

`pot` stands for Pr Overview Tool

# How it works

`pot` creates accumulated data for users concerning one or more repositories, using
github's graphql api.

# Installation

```sh
$ git clone https://github.com/ioanniswd/pot
$ cd pot

$ gem build pot.gemspec
$ gem install --local pot
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

User                  | Authored | Reviewing | Total | Actionable | Untouched
-----------------------------------------------------------------------------
doe                            3           0       3            1           0
jane                           1           2       3            2           0
john                           2           1       3            3           0
```

Note: By default, `pot` only counts open PRs.

#### Authored
Number of PRs authored by the user

#### Reviewing
Number of PRs currently reviewing, meaning that said user has not
approved, or rejected the PR. If user is a requested reviewer, or if user has
placed comments but has not approved or rejeted the PR, they are considered
**active reviewers**, and said PR counts as one they are currently reviewing.

#### Total
Authored + Reviewing

#### Actionable
A PR is considered actionable for a user, when said user can
perform any action in said PR, and is probably blocking another user. For
example, if `john` is the author of a PR, and `jane` places some comments, that PR
becomes actionable for `john`, and non actionable for `jane`. When `john` responds to
`jane's` comments and re-requests review from her, PR becomes non actionable for
`john` and actionable for `jane`.

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

User                  | Authored | Reviewing | Total | Actionable | Untouched
-----------------------------------------------------------------------------
doe                            2           3       5            3           1

Authored:
---------
Actionable | Approvals |     +/-     | PR
Yes            2 / 2     4729 / 1561   Add feature cool (PR_url)
No             1 / 3       12 / 58     Fix bug wah(PR_url)

Reviewing:
----------
Actionable | Untouched | Author: Actionables | Approvals |     +/-     | PR
Yes          Yes         john: 1                 1 / 2      304 / 39     Add feature wow (PR_url)
Yes          No          john: 1                 0 / 2      237 / 435    Fix bug dang (PR_url)
No           No          jane: 2                 3 / 3        5 / 2      Improve styles (PR_url)
```

Note: Both `--users=<user, names>` and `--user='user'` can be used:
```sh
$ pot --users=john,jane --user=doe
```
And both the accumulative and the specific output will be shown

In the above example, the accumulative data is shown for user `doe`, as well
as some details about each of the PRs they are involved in. This can be used by
`doe` to figure out which PR needs their attention first, or by another user
who happened to have some idle time and wants to help out.

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
$ pot --user=doe | xargs -L1 xdg-open
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

# Contributing

1. Create an issue describing the purpose of the pull request unless there is one already
2. Fork the repository ( https://github.com/ioanniswd/pot/fork )
3. Create your feature branch (`git checkout -b my-new-feature`)
4. Commit your changes (`git commit -am 'Add some feature'`)
5. Push to the branch (`git push origin my-new-feature`)
6. Create a new Pull Request

# License

This tool is open source under the [MIT License](https://opensource.org/licenses/MIT) terms.

[[Back To Top]](#pot)

