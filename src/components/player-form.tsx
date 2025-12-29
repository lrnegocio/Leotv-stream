"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { VideoPlayer } from "@/components/video-player";
import { Separator } from "@/components/ui/separator";

const FormSchema = z.object({
  source: z.string().min(1, "Please enter a URL or embed code."),
});

type FormValues = z.infer<typeof FormSchema>;

export function PlayerForm() {
  const [sourceToPlay, setSourceToPlay] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      source: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    setSourceToPlay(data.source);
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Embed Your Content</CardTitle>
        <CardDescription>
          Paste a YouTube URL, Canva URL, or an embed code below.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., https://www.youtube.com/watch?v=..."
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Load Player
            </Button>
          </CardFooter>
        </form>
      </Form>
      <Separator />
      <CardContent className="p-4 md:p-6">
        <div className="rounded-lg bg-muted/50 p-4 min-h-[300px] flex justify-center items-center">
            <VideoPlayer source={sourceToPlay} />
        </div>
      </CardContent>
    </Card>
  );
}
