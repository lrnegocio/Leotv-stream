"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const FormSchema = z.object({
  source: z.string().min(1, "Please enter a URL or embed code."),
});

type FormValues = z.infer<typeof FormSchema>;

type PlayerFormProps = {
  setSourceToPlay: (source: string) => void;
};

export function PlayerForm({ setSourceToPlay }: PlayerFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      source: "https://www.canva.com/design/DAG6ONyt5ks/6DuizP3XWwr5xFWBi383CQ/view?embed",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    setSourceToPlay(data.source);
  };

  return (
    <div className="p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL ou código de incorporação</FormLabel>
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
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Carregar Player
            </Button>
        </form>
      </Form>
    </div>
  );
}
