import axios, { AxiosRequestConfig } from "axios";
import { Uri } from "vscode";
import { credentials } from "./authentication.service";
import { REPOSITORY_DEFAULT_BRANCH } from "../config";
import { objectToQueryString } from "./string.service";

/** The root URI to build queries off of */
const ROOT_URI = Uri.parse("https://api.github.com", true);
const RAW_ROOT_URI = Uri.parse("https://raw.githubusercontent.com", true);

/** The version of the GitHub REST API to use */
const API_VERSION = "2022-11-28";

/** Gets the headers to use for requests */
const getHeaders = () => {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        ["X-GitHub-Api-Version"]: API_VERSION,
    };

    if (credentials.access_token)
        headers.Authorization = `Bearer ${credentials.access_token}`;

    return headers;
};

namespace GitHub {
    /** Operations relating to a repository. */
    export namespace repos {
        /** Operations relating to a repository's git tree. */
        export namespace tree {
            export type GitTreeNode = {
                path: string;
                mode: string;
                type: "blob" | "tree";
                sha: string;
                size: number;
                url: string;
            };
            /**
             * Get the Git tree of a repo.
             *
             * @param owner The owner of the repository
             * @param repo The name of the repository
             * @param sha The SHA of the tree
             * @param recursive Whether to include all tree entries or only the top-level entries
             * @returns The Git tree
             */
            export async function get(
                owner: string,
                repo: string,
                sha: string,
                recursive = false
            ) {
                type Response = {
                    sha: string;
                    url: string;
                    tree: GitTreeNode[];
                    truncated: boolean;
                };

                let uri = Uri.joinPath(
                    ROOT_URI,
                    "repos",
                    owner,
                    repo,
                    "git",
                    "trees",
                    sha
                );

                if (recursive) uri = uri.with({ query: "recursive=true" });

                const response = await axios.get<Response>(uri.toString(true), {
                    headers: getHeaders(),
                });
                return response.data;
            }
        }

        /** Get the content of an item in a repo.
         * @param owner The username of the owner of the repo
         * @param repo The name of the repo
         * @param path The path to the item from the root of the repo
         */
        export async function getContent(
            owner: string,
            repo: string,
            path: string
        ) {
            type Response = {
                name: string;
                path: string;
                sha: string;
                size: number;
                url: string;
                html_url: string;
                git_url: string;
                download_url: string | null;
                type: "file" | "dir";
                content?: string;
                encoding?: "base64";
                _links: {
                    self: string;
                    git: string;
                    html: string;
                };
            };
            const uri = Uri.joinPath(
                ROOT_URI,
                "repos",
                owner,
                repo,
                "contents",
                path
            );

            const response = await axios.get<Response>(uri.toString(true), {
                headers: getHeaders(),
            });

            return response.data;
        }

        /** Download the raw contents of a file
         * @param owner The username of the owner of the repo
         * @param repo The name of the repo
         * @param path The path to the item from the root of the repo
         * @param type The expected response type
         */
        export async function downloadFile<T>(
            owner: string,
            repo: string,
            path: string,
            type?: AxiosRequestConfig["responseType"]
        ): Promise<T> {
            const uri = Uri.joinPath(
                RAW_ROOT_URI,
                owner,
                repo,
                REPOSITORY_DEFAULT_BRANCH,
                path
            );

            const response = await axios.get(uri.toString(true), {
                responseType: type ?? "text",
            });
            return response.data;
        }

        /** Operations relating to the commits of a repo. */
        export namespace commits {
            type ListOptions = {
                sha?: string;
                path?: string;
                author?: string;
                since?: string;
                until?: string;
                per_page?: number;
                page?: number;
            };
            type CommitEntry = {
                url: string;
                sha: string;
                node_id: string;
                html_url: string;
                comments_url: string;
                commit: Commit;
                author: CommitEntryContributor;
                committer: CommitContributor;
                parents: ParentCommit[];
            };

            type CommitEntryContributor = {
                login: string;
                id: number;
                node_id: string;
                avatar_url: string;
                gravatar_id: string;
                url: string;
                html_url: string;
                followers_url: string;
                following_url: string;
                gists_url: string;
                starred_url: string;
                subscriptions_url: string;
                organizations_url: string;
                repos_url: string;
                events_url: string;
                received_events_url: string;
                type: string;
                site_admin: boolean;
            };

            type Commit = {
                url: string;
                author: CommitContributor;
                committer: CommitContributor;
                message: string;
                tree: ParentCommit;
                comment_count: number;
                verification: Verification;
            };

            type CommitContributor = {
                name: string;
                email: string;
                date: Date;
            };

            type ParentCommit = {
                url: string;
                sha: string;
            };

            type Verification = {
                verified: boolean;
                reason: string;
                signature: null;
                payload: null;
            };

            /** List the commits for a repository
             * @param owner The username of the owner of the repo
             * @param repo The name of the repo
             * @param options Various options for filtering commits
             */
            export async function list(
                owner: string,
                repo: string,
                options?: ListOptions
            ) {
                let uri = Uri.joinPath(
                    ROOT_URI,
                    "repos",
                    owner,
                    repo,
                    "commits"
                );

                if (Object.keys(options ?? {}).length > 0) {
                    uri = uri.with({
                        query: `?${objectToQueryString(options)}`,
                    });
                }

                const response = await axios.get<CommitEntry[]>(
                    uri.toString(true),
                    { headers: getHeaders() }
                );
                return response.data;
            }
        }
    }
}

export default GitHub;
