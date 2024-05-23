import { Await, Form, useFetcher, useLoaderData } from "@remix-run/react";
import { Suspense, type FunctionComponent } from "react";
import type { ContactRecord } from "../../data";
import { ActionFunctionArgs, LoaderFunctionArgs, defer } from "@remix-run/node";
import { getContact, updateContact } from "../../data";
import invariant from "tiny-invariant";
import { fetchEmoji } from "./emoji.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  const contact = getContact(params.contactId);
  const emojis = fetchEmoji();

  if (!contact) {
    throw new Response("Not Found", { status: 404 });
  }

  // return json({contact, emojis});
  return defer({ contact, emojis });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  const formData = await request.formData();

  return updateContact(params.contactId, {
    favorite: formData.get("favorite") === "true",
  });
};

export default function Contact() {
  const { contact, emojis } = useLoaderData<typeof loader>();

  return (
    <>
      <Suspense fallback={<h3>Loading...</h3>}>
        <Await resolve={contact}>
          {(resolvedContact) => (
            <div id="contact">
              <div>
                <img
                  alt={`${resolvedContact!.first} ${
                    resolvedContact!.last
                  } avatar`}
                  key={resolvedContact!.avatar}
                  src={resolvedContact!.avatar}
                />
              </div>
              <div>
                <h1>
                  {resolvedContact!.first || resolvedContact!.last ? (
                    <>
                      {resolvedContact!.first} {resolvedContact!.last}
                    </>
                  ) : (
                    <i>No Name</i>
                  )}{" "}
                  <Favorite contact={resolvedContact!} />
                </h1>

                {resolvedContact!.twitter && (
                  <p>
                    <a href={`https://twitter.com/${resolvedContact!.twitter}`}>
                      {resolvedContact!.twitter}
                    </a>
                  </p>
                )}

                {resolvedContact!.notes && <p>{resolvedContact!.notes}</p>}

                <div>
                  <Form action="edit">
                    <button type="submit">Edit</button>
                  </Form>

                  <Form
                    action="destroy"
                    method="post"
                    onSubmit={(event) => {
                      const response = confirm(
                        "Please confirm you want to delete this record."
                      );
                      if (!response) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <button type="submit">Delete</button>
                  </Form>
                </div>
              </div>
            </div>
          )}
        </Await>
      </Suspense>
      <h3>Emojis</h3>
      <Suspense fallback={<h3>Loading...</h3>}>
        <Await errorElement={<h3>Something went wrong!</h3>} resolve={emojis}>
          {(emojis) => (
            <ul>
              {emojis.slice(0, 3).map((emoji: any) => (
                <li key={emoji.name}>{emoji.name}</li>
              ))}
            </ul>
          )}
        </Await>
      </Suspense>
    </>
  );
}

const Favorite: FunctionComponent<{
  contact: Pick<ContactRecord, "favorite">;
}> = ({ contact }) => {
  const fetcher = useFetcher();
  const favorite = fetcher.formData
    ? fetcher.formData.get("favorite") === "true"
    : contact.favorite;

  return (
    <fetcher.Form method="post">
      <button
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        name="favorite"
        value={favorite ? "false" : "true"}
      >
        {favorite ? "★" : "☆"}
      </button>
    </fetcher.Form>
  );
};
